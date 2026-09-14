# Avance de Proyecto en Minería de Datos N°1

## Información general

## Autores: 

**Milton Cesar Machado Barreto**  
**Raúl Andrés Triana Ortega**  

**Programa:** Ingeniería de Sistemas  
**Curso:** Minería de Datos 
**Facultad de Ingeniería**  
**Corporación Universitaria Minuto de Dios – UNIMINUTO**  
**Vicerrectoría Regional Centro Sur**  
 
**Año:** 2026

---

## Descripción del proyecto

Este proyecto tiene como objetivo aplicar técnicas básicas de preparación, limpieza y cruce de datos sobre un conjunto de información relacionado con compras en línea. Se trabaja con un dataset de comportamiento de usuarios en tiendas virtuales, con variables como tipo de sesión, canales de acceso, duración, tasas de rebote, comportamiento de compra y variables de marketing.

El proyecto busca:

- cargar y revisar la base de datos,
- validar la estructura del dataset,
- limpiar registros duplicados y anomalías,
- generar identificadores por sesión,
- cruzar información de navegación con datos de marketing,
- preparar una base unificada para análisis posterior.

---

## Objetivo del trabajo

Desarrollar un proceso de minería y preparación de datos que permita:

1. Comprender la estructura del dataset.
2. Identificar inconsistencias o valores atípicos.
3. Realizar un cruce de información entre variables de navegación y marketing.
4. Generar una versión limpia y usable para análisis exploratorio y modelado.

---

## Dataset utilizado

El proyecto usa el archivo:

- `online_shoppers_intention.csv`

Este conjunto de datos contiene información de usuarios que navegan en una tienda en línea, con indicadores de comportamiento y si finalmente realizaron una compra.

---

## Estructura del proyecto

```text
ProyectoMineriaDeDatos/
├── 01_preparacion_y_cruce_de_datos.py   # Preparación del dataset y cruce con base de marketing
├── proceso_extraccion_limpieza.py       # Pipeline de limpieza, validación y exportación
├── proyecto.py                          # Exploración inicial del dataset
├── online_shoppers_intention.csv        # Base de datos principal
├── dataset_limpio_cruce_marketing.csv   # Archivo generado por el proceso de limpieza
├── README.md                            # Documentación del proyecto
└── .git/                                # Git del repositorio
```

---

## Descripción de archivos

### 1. `proyecto.py`
Este archivo funciona como una primera exploración del dataset. Se encarga de:

- cargar el CSV,
- verificar que existan columnas importantes,
- mostrar los primeros registros,
- mostrar el tamaño del dataset,
- mostrar la estructura y tipos de datos.

Se usa como punto de partida para conocer la base antes de limpiar o transformar datos.

### 2. `01_preparacion_y_cruce_de_datos.py`
Este archivo realiza la preparación del dataset y el cruce con una base artificial de marketing.

Incluye:

- lectura del dataset local,
- generación de identificadores de sesión,
- creación de una tabla de marketing con canal, cupón, nivel de fidelidad y gasto histórico,
- unión de ambas fuentes por `Session_ID`,
- impresión de resultados del cruce.

### 3. `proceso_extraccion_limpieza.py`
Es el flujo principal de extracción y limpieza.

Realiza:

- carga del CSV,
- eliminación de duplicados,
- generación de `Session_ID`,
- normalización de columnas de texto,
- validación de rangos de datos,
- tratamiento de outliers con IQR,
- cruce con la tabla de marketing,
- exportación del resultado final en un CSV limpio.

---

## Requisitos

Para ejecutar este proyecto se requiere tener instalado Python y las librerías:

```bash
pip install pandas numpy
```

---

## Cómo ejecutar el proyecto

Desde la carpeta del proyecto, puedes correr cada script con:

```bash
python proyecto.py
```

```bash
python 01_preparacion_y_cruce_de_datos.py
```

```bash
python proceso_extraccion_limpieza.py
```

> La ejecución de la versión corregida de `01_preparacion_y_cruce_de_datos.py` usa el archivo local del proyecto para evitar errores por URL no disponible.

---

## Resultado esperado

La ejecución correcta del proyecto permite obtener:

- análisis inicial del dataset,
- limpieza de registros duplicados,
- validación de variables relevantes,
- unión con información de marketing,
- archivo final de datos procesados y listos para análisis.

---

## Observaciones importantes

El proyecto evidencia la aplicación de procesos de minería de datos básicos, especialmente en etapas de:

- preparación de datos,
- limpieza,
- integración de fuentes,
- tratamiento de valores atípicos,
- transformación para análisis posterior.

---

## Conclusión

Este proyecto representa una base sólida para la preparación de datos en minería de datos, mostrando la forma en que se integran variables de navegación y marketing para generar una visión más completa del comportamiento del cliente en e-commerce.

---

## Autoría

Proyecto académico desarrollado por:

- Milton Cesar Machado Barreto
- Raúl Andrés Triana Ortega

Docente:

- Esteban Ernesto Morales Castro

---

## Licencia

Este proyecto fue desarrollado con fines académicos dentro del curso de Minería de Datos.
