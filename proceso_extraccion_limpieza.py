from pathlib import Path

import numpy as np
import pandas as pd

BASE = Path(__file__).resolve().parent
ARCHIVO = BASE / "online_shoppers_intention.csv"
SALIDA = BASE / "dataset_limpio_cruce_marketing.csv"

class ExtractorDatos:
    """Extracción de datos desde archivos CSV."""

    def cargar_csv(self, ruta: Path) -> pd.DataFrame:
        print(f"[Extracción] Cargando: {ruta.name}")
        if not ruta.exists():
            raise FileNotFoundError(f"No se encontró el archivo en: {ruta}")
        return pd.read_csv(ruta)

class LimpiadorPipeline:
    """Cruce, diagnóstico y limpieza del dataset de E-commerce y Marketing."""

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.log = []

    def remover_duplicados(self):
        antes = len(self.df)
        self.df = self.df.drop_duplicates(keep="first").copy()
        removidos = antes - len(self.df)
        self.log.append(["Duplicados exactos", removidos, "Filas eliminadas"])
        return self

    def generar_session_id(self):
        """Asigna un identificador único por sesión de usuario."""
        if "Session_ID" not in self.df.columns:
            self.df.insert(0, "Session_ID", [f"SESS_{i:06d}" for i in range(1, len(self.df) + 1)])
            self.log.append(["Generación ID", len(self.df), "Session_ID asignado"])
        return self

    def limpiar_texto(self):
        for col in ["Month", "VisitorType"]:
            if col in self.df.columns:
                self.df[col] = self.df[col].astype("string").str.strip()
        self.log.append(["Estandarización de texto", 0, "Month y VisitorType"])
        return self

    def validar_dominios(self):
        reglas = {
            "BounceRates": (0, 1),
            "ExitRates": (0, 1),
            "SpecialDay": (0, 1),
        }
        for col, (lo, hi) in reglas.items():
            if col in self.df.columns:
                n = int(((self.df[col] < lo) | (self.df[col] > hi)).sum())
                self.log.append([f"Valores fuera de rango: {col}", n, f"Rango esperado [{lo}, {hi}]"])
        return self

    def cruzar_marketing(self, df_marketing: pd.DataFrame):
        self.df = pd.merge(
            self.df,
            df_marketing,
            on="Session_ID",
            how="inner",
            validate="one_to_one"
        )
        self.log.append(["Cruce de información", len(self.df), "Inner Join por Session_ID"])
        return self

    def tratar_outliers_iqr(self, columnas):
        for col in columnas:
            if col not in self.df.columns:
                continue
            q1 = self.df[col].quantile(0.25)
            q3 = self.df[col].quantile(0.75)
            iqr = q3 - q1
            limite_inf = max(0, q1 - 1.5 * iqr)
            limite_sup = q3 + 1.5 * iqr

            if col in ["BounceRates", "ExitRates"]:
                limite_inf = max(0, limite_inf)
                limite_sup = min(1, limite_sup)

            mask = (self.df[col] < limite_inf) | (self.df[col] > limite_sup)
            n_outliers = int(mask.sum())

            # Capping de valores
            self.df[col] = self.df[col].clip(limite_inf, limite_sup)
            self.log.append([
                f"IQR - {col}", n_outliers,
                f"Q1={q1:.4f}; Q3={q3:.4f}; límites=[{limite_inf:.4f}, {limite_sup:.4f}]"
            ])
        return self

def crear_base_marketing(ids, semilla=42):
    """Crea la fuente sintética de marketing vinculada por Session_ID."""
    rng = np.random.default_rng(semilla)
    n = len(ids)

    return pd.DataFrame({
        "Session_ID": ids,
        "Canal_Origen": rng.choice(
            ["Organico", "Google_Ads", "Email_Marketing", "Redes_Sociales", "Influencer"],
            size=n, p=[0.30, 0.25, 0.20, 0.15, 0.10]
        ),
        "Cupon_Aplicado": rng.choice([True, False], size=n, p=[0.20, 0.80]),
        "Nivel_Fidelidad": rng.choice(
            ["Bronze", "Silver", "Gold", "Platinum"],
            size=n, p=[0.50, 0.30, 0.15, 0.05]
        ),
        "Gasto_Historico_USD": np.round(
            rng.exponential(scale=150, size=n), 2
        )
    })

if __name__ == "__main__":
    extractor = ExtractorDatos()
    df_raw = extractor.cargar_csv(ARCHIVO)

    # Pipeline continuo manteniendo el historial de transformaciones
    pipeline = LimpiadorPipeline(df_raw)
    
    # Paso 1: Limpieza base y generación de Session_ID
    pipeline.remover_duplicados().generar_session_id().limpiar_texto().validar_dominios()

    # Paso 2: Generar base de marketing compatible
    df_marketing = crear_base_marketing(pipeline.df["Session_ID"].to_numpy())

    # Paso 3: Cruce y tratamiento numérico con IQR
    pipeline.cruzar_marketing(df_marketing).tratar_outliers_iqr([
        "Administrative_Duration",
        "Informational_Duration",
        "ProductRelated_Duration",
        "BounceRates",
        "ExitRates",
        "PageValues"
    ])

    df_final = pipeline.df
    df_final.to_csv(SALIDA, index=False)

    print("\n--- RESUMEN DEL PROCESO ---")
    print(f"Registros iniciales : {len(df_raw):,}")
    print(f"Registros finales   : {len(df_final):,}")
    print(f"Columnas finales    : {df_final.shape[1]}")
    print(f"Archivo guardado en : {SALIDA.name}")
    
    print("\n--- BITÁCORA DE TRANSFORMACIONES ---")
    df_log = pd.DataFrame(pipeline.log, columns=["Paso", "Afectados", "Detalle"])
    print(df_log.to_string(index=False))