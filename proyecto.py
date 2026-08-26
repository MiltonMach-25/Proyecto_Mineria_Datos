from pathlib import Path

import pandas as pd

# Cargar el dataset
archivo_csv = Path(__file__).with_name("online_shoppers_intention.csv")
df = pd.read_csv(archivo_csv)

columnas_esperadas = {"Administrative", "Informational", "ProductRelated", "Revenue"}
columnas_faltantes = columnas_esperadas - set(df.columns)
if columnas_faltantes:
	raise ValueError(
		f"{archivo_csv.name} no contiene un dataset válido. "
		f"Faltan las columnas: {', '.join(sorted(columnas_faltantes))}. "
		"Reemplaza el archivo por el CSV original de Online Shoppers Intention."
	)

# Mostrar los primeros 5 registros
print("PRIMEROS 5 REGISTROS:")
print(df.head())

# Mostrar cantidad de filas y columnas
print("\nTAMAÑO DEL DATASET:")
print(df.shape)

# Mostrar información general
print("\nINFORMACIÓN DEL DATASET:")
df.info()