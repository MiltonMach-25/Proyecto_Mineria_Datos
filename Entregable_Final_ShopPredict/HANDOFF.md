# Handoff técnico · ShopPredict

## Arquitectura actual

GitHub contiene el repositorio y Replit ejecuta la aplicación. El servidor Python sirve la presentación y el dashboard, y calcula los indicadores desde `data/online_shoppers_intention.csv`. No se requieren credenciales ni servicios externos.

## Ejecución

- Replit inicia `Entregable_Final_ShopPredict/app.py` mediante `.replit` en la raíz.
- Localmente, desde esta carpeta: `python app.py`.
- Pruebas, desde la raíz del repositorio:

  ```powershell
  cd Entregable_Final_ShopPredict
  python -m unittest discover -s tests
  ```

El servidor usa el puerto definido por `PORT` o el 3000 por defecto. El dashboard obtiene `/api/stats` del mismo servidor. Las filas duplicadas exactas se excluyen antes de calcular los indicadores.

## Entrega académica

- La presentación mantiene las tres diapositivas de métodos numéricos.
- Los resultados documentados de modelos se leen de `assets/evidencias/metricas_modelos.csv`.
- Naive Bayes y KNN no tienen métricas finales calculadas para esta partición; no presentarlas como resultados.
- No afirmar un despliegue público hasta publicarlo y probarlo desde Replit.
