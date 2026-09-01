import pandas as pd
import numpy as np

# 1. Cargar el dataset principal de navegación desde la web
url = "https://raw.githubusercontent.com/datasets/online-shoppers-purchasing-intention/main/data/online_shoppers_intention.csv"
df_navegacion = pd.read_csv(url)

# Crear un ID único para cada sesión de usuario
df_navegacion['Session_ID'] = ['SESS_' + str(i).zfill(6) for i in range(1, len(df_navegacion) + 1)]

print(f"Dimensiones de la base de navegación: {df_navegacion.shape}")


# 2. Generar la segunda base de datos: 'df_marketing'
# Simulamos datos de promociones y perfil de usuario para las mismas sesiones
np.random.seed(42)

ids_sesiones = df_navegacion['Session_ID'].values
campanias = ['Organico', 'Google_Ads', 'Email_Marketing', 'Redes_Sociales', 'Influencer']
niveles_fidelidad = ['Bronze', 'Silver', 'Gold', 'Platinum']

df_marketing = pd.DataFrame({
    'Session_ID': ids_sesiones,
    'Canal_Origen': np.random.choice(campanias, size=len(ids_sesiones), p=[0.3, 0.25, 0.2, 0.15, 0.1]),
    'Cupon_Aplicado': np.random.choice([True, False], size=len(ids_sesiones), p=[0.2, 0.8]),
    'Nivel_Fidelidad': np.random.choice(niveles_fidelidad, size=len(ids_sesiones), p=[0.5, 0.3, 0.15, 0.05]),
    'Gasto_Historico_USD': np.round(np.random.exponential(scale=150, size=len(ids_sesiones)), 2)
})

print(f"Dimensiones de la base de marketing: {df_marketing.shape}")


# 3. Realizar el CRUCE DE INFORMACIÓN (MERGE)
# Usamos 'inner' join mediante la clave común 'Session_ID'
df_proyecto = pd.merge(
    left=df_navegacion,
    right=df_marketing,
    on='Session_ID',
    how='inner'
)

print("\n--- ¡Cruce realizado con éxito! ---")
print(f"Nuevas dimensiones del dataset unificado: {df_proyecto.shape}")
print("\nPrimeras 5 filas con las variables integradas:")
print(df_proyecto[['Session_ID', 'Administrative', 'Month', 'Canal_Origen', 'Cupon_Aplicado', 'Revenue']].head())