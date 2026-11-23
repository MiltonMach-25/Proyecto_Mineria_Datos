from __future__ import annotations

import queue
import threading
from datetime import datetime
from pathlib import Path
from tkinter import filedialog, messagebox, ttk
import tkinter as tk

import matplotlib

matplotlib.use("TkAgg")
import numpy as np
import pandas as pd
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
from shoppredict_model import TARGET, evaluate_models, normalize_target


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATASET = BASE_DIR / "online_shoppers_intention.csv"
COLOR_BG = "#0F172A"
COLOR_FRAME = "#1E293B"
COLOR_PRIMARY = "#38BDF8"
COLOR_TEXT = "#F8FAFC"
COLOR_MUTED = "#CBD5E1"
COLOR_SUCCESS = "#10B981"
COLOR_WARNING = "#FBBF24"
COLOR_PLOT = "#020617"


class ShopPredictApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("ShopPredict | Minería de Datos")
        self.root.geometry("1120x790")
        self.root.minsize(920, 680)
        self.root.configure(bg=COLOR_BG)

        self.df: pd.DataFrame | None = None
        self.model_results: list[dict[str, object]] = []
        self.training_details: dict[str, int] = {}
        self.events: queue.Queue[tuple[str, object]] = queue.Queue()
        self.training = False

        self.configure_styles()
        self.create_widgets()
        self.root.after(100, self.process_events)
        self.log(
            "ShopPredict listo. Carga el dataset para explorar los datos y "
            "ejecutar el proceso reproducible."
        )
        if DEFAULT_DATASET.exists():
            self.load_dataset_path(DEFAULT_DATASET)

    def configure_styles(self) -> None:
        style = ttk.Style()
        style.theme_use("clam")
        style.configure(
            "TNotebook",
            background=COLOR_BG,
            borderwidth=0,
            tabmargins=(2, 5, 2, 0),
        )
        style.configure(
            "TNotebook.Tab",
            background=COLOR_FRAME,
            foreground=COLOR_MUTED,
            padding=(14, 8),
            font=("Segoe UI", 10, "bold"),
        )
        style.map(
            "TNotebook.Tab",
            background=[("selected", COLOR_PRIMARY)],
            foreground=[("selected", COLOR_BG)],
        )
        style.configure(
            "Treeview",
            background=COLOR_FRAME,
            foreground=COLOR_TEXT,
            fieldbackground=COLOR_FRAME,
            rowheight=27,
            borderwidth=0,
        )
        style.configure(
            "Treeview.Heading",
            background=COLOR_PRIMARY,
            foreground=COLOR_BG,
            font=("Segoe UI", 9, "bold"),
        )
        style.map("Treeview", background=[("selected", "#0369A1")])

    def create_widgets(self) -> None:
        header = tk.Frame(self.root, bg=COLOR_FRAME, padx=22, pady=14)
        header.pack(fill=tk.X)
        tk.Label(
            header,
            text="🛒 ShopPredict",
            font=("Segoe UI", 23, "bold"),
            fg=COLOR_PRIMARY,
            bg=COLOR_FRAME,
        ).pack(anchor="w")
        tk.Label(
            header,
            text="Predicción de intención de compra | Minería de Datos · UNIMINUTO · 2026",
            font=("Segoe UI", 10),
            fg=COLOR_TEXT,
            bg=COLOR_FRAME,
        ).pack(anchor="w", pady=(2, 0))

        toolbar = tk.Frame(self.root, bg=COLOR_BG, padx=18, pady=12)
        toolbar.pack(fill=tk.X)
        self.load_button = self.make_button(
            toolbar, "1. Cargar dataset", self.load_dataset, COLOR_PRIMARY, COLOR_BG
        )
        self.load_button.pack(side=tk.LEFT, padx=(0, 8))
        self.train_button = self.make_button(
            toolbar,
            "2. Entrenar y evaluar",
            self.start_training,
            COLOR_FRAME,
            COLOR_PRIMARY,
        )
        self.train_button.pack(side=tk.LEFT, padx=4)
        self.report_button = self.make_button(
            toolbar, "Guardar informe", self.export_report, COLOR_FRAME, COLOR_TEXT
        )
        self.report_button.pack(side=tk.RIGHT, padx=(8, 0))
        self.evidence_button = self.make_button(
            toolbar,
            "Exportar evidencias",
            self.export_evidence,
            COLOR_FRAME,
            COLOR_TEXT,
        )
        self.evidence_button.pack(side=tk.RIGHT)

        self.status_label = tk.Label(
            self.root,
            text="Sin dataset cargado",
            bg=COLOR_BG,
            fg=COLOR_MUTED,
            font=("Segoe UI", 9),
            padx=22,
        )
        self.status_label.pack(fill=tk.X, pady=(0, 8))

        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=18, pady=(0, 12))
        self.summary_tab = self.make_tab("Resumen")
        self.data_tab = self.make_tab("Datos y EDA")
        self.method_tab = self.make_tab("Metodología")
        self.models_tab = self.make_tab("Modelos")
        self.log_tab = self.make_tab("Bitácora")
        self.build_summary_tab()
        self.build_data_tab()
        self.build_method_tab()
        self.build_models_tab()
        self.build_log_tab()

    def make_button(
        self,
        parent: tk.Widget,
        text: str,
        command: object,
        background: str,
        foreground: str,
    ) -> tk.Button:
        return tk.Button(
            parent,
            text=text,
            command=command,
            bg=background,
            fg=foreground,
            activebackground=COLOR_PRIMARY,
            activeforeground=COLOR_BG,
            font=("Segoe UI", 10, "bold"),
            relief=tk.FLAT,
            padx=13,
            pady=8,
            cursor="hand2",
        )

    def make_tab(self, title: str) -> ttk.Frame:
        frame = ttk.Frame(self.notebook)
        self.notebook.add(frame, text=title)
        return frame

    def styled_text(
        self,
        parent: tk.Widget,
        text: str,
        *,
        font: tuple[str, int] = ("Segoe UI", 10),
        foreground: str = COLOR_TEXT,
        background: str = COLOR_FRAME,
    ) -> tk.Text:
        widget = tk.Text(
            parent,
            wrap=tk.WORD,
            bg=background,
            fg=foreground,
            insertbackground=COLOR_TEXT,
            font=font,
            relief=tk.FLAT,
            padx=15,
            pady=12,
            spacing1=2,
            spacing3=5,
        )
        widget.insert("1.0", text)
        widget.configure(state=tk.DISABLED)
        return widget

    def build_summary_tab(self) -> None:
        self.summary_tab.configure(padding=16)
        cards = tk.Frame(self.summary_tab, bg=COLOR_BG)
        cards.pack(fill=tk.X, pady=(0, 14))
        self.card_values: dict[str, tk.Label] = {}
        for key, title in [
            ("rows", "SESIONES"),
            ("columns", "VARIABLES"),
            ("purchase", "COMPRAS"),
            ("quality", "CALIDAD"),
        ]:
            card = tk.Frame(cards, bg=COLOR_FRAME, padx=15, pady=12)
            card.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 9))
            tk.Label(
                card,
                text=title,
                bg=COLOR_FRAME,
                fg=COLOR_MUTED,
                font=("Segoe UI", 9, "bold"),
            ).pack(anchor="w")
            value = tk.Label(
                card,
                text="—",
                bg=COLOR_FRAME,
                fg=COLOR_PRIMARY,
                font=("Segoe UI", 19, "bold"),
            )
            value.pack(anchor="w", pady=(3, 0))
            self.card_values[key] = value

        overview = (
            "PREDICCIÓN DE LA INTENCIÓN DE COMPRA EN UNA TIENDA VIRTUAL\n"
            "Mediante minería de datos y aprendizaje automático\n\n"
            "Problema: aprovechar los registros de navegación para estudiar si una "
            "sesión termina en compra. La tarea se formula como clasificación "
            "binaria supervisada; la predicción es una estimación, no una garantía "
            "de compra.\n\n"
            "Pregunta de investigación\n"
            "¿Podemos predecir si un usuario realizará una compra utilizando los "
            "datos de su comportamiento durante una visita a una tienda virtual?\n\n"
            "Objetivo\n"
            "Preparar y analizar las sesiones, entrenar modelos de clasificación "
            "y comparar su desempeño con métricas adecuadas para apoyar una "
            "interpretación comercial responsable.\n\n"
            "Dataset: Online Shoppers Purchasing Intention Dataset. La variable "
            "objetivo es Revenue (True = compra; False = sin compra). La fuente "
            "principal del modelo es el CSV original. Las columnas añadidas de "
            "marketing en la integración del proyecto son sintéticas y no se "
            "utilizan como evidencia de comportamiento real.\n\n"
            "Equipo académico: Milton Cesar Machado Barreto · Raúl Andrés Triana "
            "Ortega · Santiago Molina Maldonado\n"
            "Ingeniería de Sistemas · Minería de Datos · Corporación Universitaria "
            "Minuto de Dios — UNIMINUTO · Ibagué, 2026"
        )
        self.styled_text(self.summary_tab, overview).pack(fill=tk.BOTH, expand=True)

    def build_data_tab(self) -> None:
        self.data_tab.configure(padding=14)
        self.data_summary = tk.Label(
            self.data_tab,
            text="Carga el CSV para consultar dimensiones, tipos, faltantes, duplicados "
            "y distribución de Revenue.",
            bg=COLOR_BG,
            fg=COLOR_MUTED,
            justify=tk.LEFT,
            anchor="w",
            font=("Segoe UI", 10),
        )
        self.data_summary.pack(fill=tk.X, pady=(0, 10))
        table_frame = tk.Frame(self.data_tab, bg=COLOR_BG)
        table_frame.pack(fill=tk.BOTH, expand=True)
        columns = ("variable", "tipo", "faltantes", "valores_distintos")
        self.data_table = ttk.Treeview(
            table_frame, columns=columns, show="headings", height=7
        )
        headings = {
            "variable": "Variable",
            "tipo": "Tipo",
            "faltantes": "Faltantes",
            "valores_distintos": "Valores distintos",
        }
        for column, heading in headings.items():
            self.data_table.heading(column, text=heading)
            self.data_table.column(
                column, width=170 if column == "variable" else 140, anchor="center"
            )
        scrollbar = ttk.Scrollbar(
            table_frame, orient=tk.VERTICAL, command=self.data_table.yview
        )
        self.data_table.configure(yscrollcommand=scrollbar.set)
        self.data_table.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.chart_frame = tk.Frame(self.data_tab, bg=COLOR_BG, height=260)
        self.chart_frame.pack(fill=tk.BOTH, expand=True, pady=(12, 0))
        self.chart_frame.pack_propagate(False)

    def build_method_tab(self) -> None:
        self.method_tab.configure(padding=16)
        methodology = (
            "FLUJO DEL PROYECTO · CRISP-DM\n\n"
            "1. Comprensión del negocio\n"
            "Problema, pregunta de investigación y objetivo orientados a predecir "
            "Revenue a partir de variables de sesión.\n\n"
            "2. Comprensión de los datos\n"
            "El CSV original se inspecciona para revisar estructura, tipos, "
            "distribución de clases, faltantes y duplicados. El conteo se actualiza "
            "con el archivo realmente cargado.\n\n"
            "3. Preparación e integración\n"
            "proceso_extraccion_limpieza.py elimina duplicados exactos, genera "
            "Session_ID, estandariza texto, registra validaciones, aplica clipping "
            "IQR a variables seleccionadas e integra una fuente sintética de "
            "marketing. Esa fuente es simulada; sus campos no deben interpretarse "
            "como datos reales ni mezclarse con la evaluación del dataset original.\n\n"
            "4. Transformación y escalamiento\n"
            "Escalamiento_Proyecto compara MinMaxScaler, StandardScaler y "
            "RobustScaler. OneHotEncoder representa categorías nominales; "
            "Weekend y Cupon_Aplicado se conservan como banderas 0/1. Los "
            "transformadores se ajustan con train para evitar fuga de información.\n\n"
            "5. Discretización y reducción\n"
            "La práctica de Sesión 4 discretiza Gasto_Historico_USD en cuatro "
            "cuantiles y aplica PCA a variables numéricas estandarizadas. En los "
            "reportes existentes, PCA de escalamiento conserva al menos 90% de "
            "varianza con 6 componentes; el flujo general de Sesión 4 lo hace con "
            "10 componentes. Son prácticas distintas, con conjuntos de entrada "
            "diferentes.\n\n"
            "6. Modelado y evaluación en esta aplicación\n"
            "Árbol de Decisión y Random Forest usan variables numéricas imputadas "
            "sin escalamiento; Regresión Logística usa StandardScaler. Las "
            "categorías se imputan y codifican dentro de pipelines. Los tres "
            "modelos usan la misma partición estratificada 80/20 y semilla 42. "
            "Session_ID se excluye y Revenue permanece como objetivo.\n\n"
            "Métricas: accuracy, balanced accuracy, precision, recall, F1 y "
            "ROC-AUC; también se muestra la matriz de confusión. El F1 permite "
            "observar el equilibrio entre precision y recall, mientras que "
            "balanced accuracy ayuda cuando las clases están desbalanceadas.\n\n"
            "Límites: la evaluación es una demostración académica con una única "
            "partición holdout; no prueba causalidad, aumento de ventas ni "
            "desempeño en producción. Las variables PageValues y de navegación "
            "son observadas durante la sesión, por lo que el uso en vivo debe "
            "verificar qué información estaría disponible al momento de predecir."
        )
        self.styled_text(self.method_tab, methodology).pack(fill=tk.BOTH, expand=True)

    def build_models_tab(self) -> None:
        self.models_tab.configure(padding=14)
        tk.Label(
            self.models_tab,
            text="Comparación con el mismo holdout estratificado. Los modelos basados "
            "en árboles no requieren escalamiento; Regresión Logística sí.",
            bg=COLOR_BG,
            fg=COLOR_MUTED,
            justify=tk.LEFT,
            anchor="w",
            font=("Segoe UI", 9),
        ).pack(fill=tk.X, pady=(0, 10))
        columns = (
            "model",
            "scaling",
            "accuracy",
            "balanced",
            "precision",
            "recall",
            "f1",
            "auc",
        )
        self.model_table = ttk.Treeview(
            self.models_tab, columns=columns, show="headings", height=5
        )
        headings = {
            "model": ("Modelo", 175),
            "scaling": ("Numéricas", 145),
            "accuracy": ("Accuracy", 90),
            "balanced": ("Bal. accuracy", 105),
            "precision": ("Precision", 90),
            "recall": ("Recall", 85),
            "f1": ("F1", 85),
            "auc": ("ROC-AUC", 90),
        }
        for column, (heading, width) in headings.items():
            self.model_table.heading(column, text=heading)
            self.model_table.column(column, width=width, anchor="center")
        self.model_table.pack(fill=tk.X)
        self.confusion_frame = tk.Frame(self.models_tab, bg=COLOR_BG)
        self.confusion_frame.pack(fill=tk.BOTH, expand=True, pady=(10, 0))

    def build_log_tab(self) -> None:
        self.log_tab.configure(padding=12)
        self.log_text = tk.Text(
            self.log_tab,
            bg=COLOR_PLOT,
            fg=COLOR_TEXT,
            insertbackground=COLOR_TEXT,
            font=("Consolas", 10),
            relief=tk.FLAT,
            padx=12,
            pady=12,
            wrap=tk.WORD,
        )
        self.log_text.pack(fill=tk.BOTH, expand=True)

    def log(self, message: str) -> None:
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)

    def load_dataset(self) -> None:
        selected = filedialog.askopenfilename(
            title="Selecciona el dataset de sesiones",
            initialdir=BASE_DIR,
            filetypes=[("Archivos CSV", "*.csv"), ("Todos los archivos", "*.*")],
        )
        if not selected:
            return
        self.load_dataset_path(Path(selected))

    def load_dataset_path(self, path: Path) -> None:
        try:
            data = pd.read_csv(path)
            if TARGET not in data.columns:
                raise ValueError(f"El archivo debe incluir la columna '{TARGET}'.")
            normalized_target = normalize_target(data[TARGET])
            data = data.copy()
            data[TARGET] = normalized_target
        except (OSError, pd.errors.ParserError, UnicodeDecodeError, ValueError) as error:
            messagebox.showerror("No se pudo cargar el dataset", str(error))
            self.log(f"ERROR al cargar datos: {error}")
            return

        self.df = data
        self.model_results.clear()
        self.training_details.clear()
        self.refresh_dataset_views(path)
        self.clear_model_results()
        self.train_button.configure(state=tk.NORMAL)
        self.report_button.configure(state=tk.NORMAL)
        self.evidence_button.configure(state=tk.NORMAL)
        self.log(
            f"Dataset cargado: {path.name} | "
            f"{len(data):,} filas x {len(data.columns)} columnas."
        )

    def refresh_dataset_views(self, path: Path) -> None:
        assert self.df is not None
        data = self.df
        target_rate = float(data[TARGET].mean())
        duplicate_count = int(data.duplicated().sum())
        missing_count = int(data.isna().sum().sum())
        self.card_values["rows"].configure(text=f"{len(data):,}")
        self.card_values["columns"].configure(text=str(len(data.columns)))
        self.card_values["purchase"].configure(text=f"{target_rate:.1%}")
        self.card_values["quality"].configure(
            text=f"{missing_count} nulos · {duplicate_count} dup."
        )
        self.status_label.configure(
            text=f"Fuente: {path.name}   |   {len(data):,} sesiones   |   "
            f"Revenue: {int(data[TARGET].sum()):,} compras / "
            f"{int((~data[TARGET]).sum()):,} sin compra"
        )
        self.data_summary.configure(
            text=(
                f"Filas: {len(data):,}   ·   Columnas: {len(data.columns)}   ·   "
                f"Valores faltantes: {missing_count:,}   ·   "
                f"Duplicados exactos: {duplicate_count:,}   ·   "
                f"Compras: {int(data[TARGET].sum()):,} ({target_rate:.1%})"
            )
        )
        for item in self.data_table.get_children():
            self.data_table.delete(item)
        for column in data.columns:
            self.data_table.insert(
                "",
                tk.END,
                values=(
                    column,
                    str(data[column].dtype),
                    int(data[column].isna().sum()),
                    int(data[column].nunique(dropna=True)),
                ),
            )
        self.draw_eda()

    def draw_eda(self) -> None:
        assert self.df is not None
        for child in self.chart_frame.winfo_children():
            child.destroy()
        data = self.df
        figure = Figure(figsize=(9.2, 2.7), dpi=100, facecolor=COLOR_BG)
        count_axis = figure.add_subplot(121)
        rate_axis = figure.add_subplot(122)
        for axis in (count_axis, rate_axis):
            axis.set_facecolor(COLOR_FRAME)
            axis.tick_params(colors=COLOR_TEXT, labelsize=8)
            for spine in axis.spines.values():
                spine.set_color(COLOR_FRAME)

        counts = data[TARGET].value_counts().reindex([False, True], fill_value=0)
        count_axis.bar(
            ["Sin compra", "Compra"],
            counts.to_numpy(),
            color=["#64748B", COLOR_SUCCESS],
            width=0.58,
        )
        count_axis.set_title("Distribución de Revenue", color=COLOR_TEXT, fontsize=10)
        count_axis.set_ylabel("Sesiones", color=COLOR_MUTED, fontsize=8)
        count_axis.bar_label(count_axis.containers[0], color=COLOR_TEXT, fontsize=8)

        category = next(
            (column for column in ["VisitorType", "Month", "Weekend"] if column in data),
            None,
        )
        if category:
            grouped = data.assign(
                _category=data[category].fillna("Sin dato").astype(str)
            ).groupby("_category", sort=False)[TARGET].mean()
            grouped = grouped.sort_values(ascending=False).head(8)
            rate_axis.barh(
                grouped.index.astype(str)[::-1],
                grouped.to_numpy()[::-1] * 100,
                color=COLOR_PRIMARY,
            )
            rate_axis.set_title(
                f"Tasa de compra por {category}", color=COLOR_TEXT, fontsize=10
            )
            rate_axis.set_xlabel("Porcentaje (%)", color=COLOR_MUTED, fontsize=8)
            rate_axis.tick_params(axis="y", labelsize=8)
            for label in rate_axis.get_yticklabels():
                label.set_color(COLOR_TEXT)
        else:
            rate_axis.text(
                0.5,
                0.5,
                "No hay variables categóricas disponibles",
                color=COLOR_TEXT,
                ha="center",
                va="center",
                transform=rate_axis.transAxes,
            )
        figure.tight_layout(pad=2)
        canvas = FigureCanvasTkAgg(figure, master=self.chart_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

    def start_training(self) -> None:
        if self.df is None or self.training:
            return
        self.training = True
        self.train_button.configure(state=tk.DISABLED, text="Entrenando...")
        self.log("Inicia la evaluación. Revenue se mantiene fuera de los predictores.")
        worker = threading.Thread(
            target=self.training_worker, args=(self.df.copy(),), daemon=True
        )
        worker.start()

    def training_worker(self, data: pd.DataFrame) -> None:
        try:
            results, details = evaluate_models(data, self.events)
            self.events.put(("success", (results, details)))
        except Exception as error:
            self.events.put(("failure", str(error)))

    def process_events(self) -> None:
        try:
            while True:
                event, payload = self.events.get_nowait()
                if event == "log":
                    self.log(str(payload))
                elif event == "success":
                    results, details = payload  # type: ignore[misc]
                    self.model_results = results
                    self.training_details = details
                    self.refresh_model_results()
                    self.training = False
                    self.train_button.configure(
                        state=tk.NORMAL, text="2. Entrenar y evaluar"
                    )
                    self.status_label.configure(
                        text=self.status_label.cget("text")
                        + f"   |   Holdout: {details['train']:,} train / "
                        f"{details['test']:,} test"
                    )
                    self.log("Evaluación terminada. Resultados listos para exportar.")
                elif event == "failure":
                    self.training = False
                    self.train_button.configure(
                        state=tk.NORMAL, text="2. Entrenar y evaluar"
                    )
                    self.log(f"ERROR durante la evaluación: {payload}")
                    messagebox.showerror("Error de entrenamiento", str(payload))
        except queue.Empty:
            pass
        self.root.after(100, self.process_events)

    def clear_model_results(self) -> None:
        for item in self.model_table.get_children():
            self.model_table.delete(item)
        for child in self.confusion_frame.winfo_children():
            child.destroy()

    def refresh_model_results(self) -> None:
        self.clear_model_results()
        for result in self.model_results:
            self.model_table.insert(
                "",
                tk.END,
                values=(
                    result["name"],
                    result["scale"],
                    f"{result['accuracy']:.3f}",
                    f"{result['balanced_accuracy']:.3f}",
                    f"{result['precision']:.3f}",
                    f"{result['recall']:.3f}",
                    f"{result['f1']:.3f}",
                    f"{result['roc_auc']:.3f}",
                ),
            )
        if not self.model_results:
            return

        best = max(self.model_results, key=lambda item: float(item["f1"]))
        matrix = np.asarray(best["confusion"])
        figure = Figure(figsize=(6.8, 3.0), dpi=100, facecolor=COLOR_BG)
        axis = figure.add_subplot(111)
        axis.set_facecolor(COLOR_FRAME)
        image = axis.imshow(matrix, cmap="Blues")
        axis.set_title(
            f"Matriz de confusión · {best['name']} (mayor F1)",
            color=COLOR_TEXT,
            fontsize=10,
            pad=10,
        )
        axis.set_xticks([0, 1], ["Sin compra", "Compra"])
        axis.set_yticks([0, 1], ["Sin compra", "Compra"])
        axis.set_xlabel("Predicción", color=COLOR_TEXT)
        axis.set_ylabel("Valor real", color=COLOR_TEXT)
        axis.tick_params(colors=COLOR_TEXT, labelsize=8)
        threshold = matrix.max() / 2 if matrix.size else 0
        for row in range(2):
            for column in range(2):
                axis.text(
                    column,
                    row,
                    f"{matrix[row, column]:,}",
                    ha="center",
                    va="center",
                    color="white" if matrix[row, column] > threshold else COLOR_BG,
                    fontweight="bold",
                )
        figure.colorbar(image, ax=axis, fraction=0.046, pad=0.04)
        figure.tight_layout()
        canvas = FigureCanvasTkAgg(figure, master=self.confusion_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

    def export_report(self) -> None:
        if self.df is None:
            messagebox.showinfo("Falta el dataset", "Carga el CSV antes de guardar el informe.")
            return
        target = filedialog.asksaveasfilename(
            title="Guardar informe del proyecto",
            initialdir=BASE_DIR,
            initialfile="informe_shoppredict.md",
            defaultextension=".md",
            filetypes=[("Informe Markdown", "*.md"), ("Archivo de texto", "*.txt")],
        )
        if not target:
            return
        data = self.df
        text = [
            "# ShopPredict — Informe de ejecución",
            "",
            f"Fecha: {datetime.now().astimezone().strftime('%Y-%m-%d %H:%M %Z')}",
            "",
            "## Proyecto",
            "",
            "Predicción de la intención de compra en una tienda virtual mediante "
            "minería de datos y aprendizaje automático.",
            "",
            "Pregunta: ¿Podemos predecir si un usuario realizará una compra utilizando "
            "los datos de su comportamiento durante una visita a una tienda virtual?",
            "",
            "## Datos cargados",
            "",
            f"- Sesiones: {len(data):,}",
            f"- Variables, incluida Revenue: {len(data.columns)}",
            f"- Compras: {int(data[TARGET].sum()):,} ({data[TARGET].mean():.2%})",
            f"- Sin compra: {int((~data[TARGET]).sum()):,}",
            f"- Valores faltantes: {int(data.isna().sum().sum()):,}",
            f"- Duplicados exactos: {int(data.duplicated().sum()):,}",
            "- Revenue se separa como objetivo y Session_ID se excluye de X.",
            "",
            "## Metodología",
            "",
            "Partición estratificada 80/20 con semilla 42. Los faltantes se imputan "
            "dentro de cada pipeline. Las categorías se codifican mediante "
            "OneHotEncoder. Regresión Logística usa StandardScaler; Árbol de "
            "Decisión y Random Forest no escalan las variables cuantitativas.",
            "",
        ]
        if self.training_details:
            text.extend(
                [
                    f"- Registros train/test: {self.training_details['train']:,} / "
                    f"{self.training_details['test']:,}",
                    f"- Duplicados exactos excluidos antes de dividir: "
                    f"{self.training_details['duplicates_removed']:,}",
                    "- Métricas evaluadas: accuracy, balanced accuracy, precision, "
                    "recall, F1 y ROC-AUC.",
                    "",
                    "## Resultados de clasificación",
                    "",
                    "| Modelo | Escalamiento | Accuracy | Balanced accuracy | Precision | Recall | F1 | ROC-AUC |",
                    "|---|---|---:|---:|---:|---:|---:|---:|",
                ]
            )
            for result in self.model_results:
                text.append(
                    f"| {result['name']} | {result['scale']} | "
                    f"{result['accuracy']:.4f} | {result['balanced_accuracy']:.4f} | "
                    f"{result['precision']:.4f} | {result['recall']:.4f} | "
                    f"{result['f1']:.4f} | {result['roc_auc']:.4f} |"
                )
            best = max(self.model_results, key=lambda item: float(item["f1"]))
            text.extend(
                [
                    "",
                    f"Modelo con mayor F1 en esta partición: **{best['name']}** "
                    f"(F1 = {best['f1']:.4f}). Este resultado describe únicamente "
                    "esta evaluación y no demuestra superioridad general.",
                    "",
                    "### Matriz de confusión del modelo con mayor F1",
                    "",
                    "| Real / Predicción | Sin compra | Compra |",
                    "|---|---:|---:|",
                    f"| Sin compra | {best['confusion'][0][0]} | "
                    f"{best['confusion'][0][1]} |",
                    f"| Compra | {best['confusion'][1][0]} | "
                    f"{best['confusion'][1][1]} |",
                    "",
                ]
            )
        else:
            text.extend(
                [
                    "Los modelos todavía no se han entrenado. Ejecute la evaluación "
                    "desde la aplicación para incluir las métricas.",
                    "",
                ]
            )
        text.extend(
            [
                "## Alcance y limitaciones",
                "",
                "La fuente de modelado en esta ejecución es el archivo cargado. "
                "La base de marketing añadida en el flujo de integración es "
                "sintética, por lo que no representa mediciones reales. La "
                "evaluación es una demostración académica con una única partición "
                "holdout; no constituye una prueba causal ni de producción. "
                "Compruebe disponibilidad temporal de las variables antes de "
                "plantear predicciones en vivo.",
                "",
                "## Equipo académico",
                "",
                "Milton Cesar Machado Barreto · Raúl Andrés Triana Ortega · "
                "Santiago Molina Maldonado",
                "",
                "Ingeniería de Sistemas · Minería de Datos · UNIMINUTO · Ibagué, 2026",
                "",
            ]
        )
        try:
            Path(target).write_text("\n".join(text), encoding="utf-8")
        except OSError as error:
            messagebox.showerror("No se pudo guardar el informe", str(error))
            return
        self.log(f"Informe exportado: {target}")
        messagebox.showinfo("Informe guardado", f"Se guardó el informe en:\n{target}")

    def export_evidence(self) -> None:
        if self.df is None:
            messagebox.showinfo(
                "Falta el dataset", "Carga el CSV antes de exportar evidencias."
            )
            return
        if not self.model_results:
            messagebox.showinfo(
                "Faltan resultados",
                "Entrena y evalúa los modelos antes de exportar las evidencias.",
            )
            return
        directory = filedialog.askdirectory(
            title="Selecciona la carpeta para guardar capturas y resultados",
            initialdir=BASE_DIR,
        )
        if not directory:
            return
        output = Path(directory)
        try:
            self.save_dataset_figure(output / "01_diagnostico_dataset.png")
            self.save_metrics_figure(output / "02_comparacion_modelos.png")
            best = max(self.model_results, key=lambda item: float(item["f1"]))
            self.save_confusion_figure(
                best, output / "03_matriz_confusion_mejor_f1.png"
            )
            pd.DataFrame(
                [
                    {
                        "Modelo": item["name"],
                        "Escalamiento_numerico": item["scale"],
                        "Accuracy": item["accuracy"],
                        "Balanced_accuracy": item["balanced_accuracy"],
                        "Precision": item["precision"],
                        "Recall": item["recall"],
                        "F1": item["f1"],
                        "ROC_AUC": item["roc_auc"],
                    }
                    for item in self.model_results
                ]
            ).to_csv(output / "metricas_modelos.csv", index=False)
            pd.DataFrame(
                best["confusion"],
                index=["Real_sin_compra", "Real_compra"],
                columns=["Predicho_sin_compra", "Predicho_compra"],
            ).to_csv(output / "matriz_confusion_mejor_f1.csv")
        except OSError as error:
            messagebox.showerror("Error al exportar evidencias", str(error))
            return
        self.log(f"Evidencias y capturas exportadas a: {output}")
        messagebox.showinfo(
            "Evidencias exportadas",
            "Se guardaron tres gráficos PNG, las métricas de modelos y la matriz "
            f"de confusión en:\n{output}",
        )

    def save_dataset_figure(self, path: Path) -> None:
        assert self.df is not None
        data = self.df
        figure = Figure(figsize=(11, 5.6), dpi=160, facecolor="white")
        count_axis = figure.add_subplot(121)
        rate_axis = figure.add_subplot(122)
        counts = data[TARGET].value_counts().reindex([False, True], fill_value=0)
        bars = count_axis.bar(
            ["Sin compra", "Compra"],
            counts.to_numpy(),
            color=["#64748B", "#10B981"],
        )
        count_axis.set_title("Distribución de la variable objetivo Revenue")
        count_axis.set_ylabel("Número de sesiones")
        count_axis.bar_label(bars, fmt=lambda value: f"{int(value):,}")
        category = next(
            (column for column in ["VisitorType", "Month", "Weekend"] if column in data),
            None,
        )
        if category:
            grouped = data.assign(
                _category=data[category].fillna("Sin dato").astype(str)
            ).groupby("_category", sort=False)[TARGET].mean()
            grouped = grouped.sort_values(ascending=False).head(8)
            rate_axis.barh(
                grouped.index.astype(str)[::-1],
                grouped.to_numpy()[::-1] * 100,
                color="#0284C7",
            )
            rate_axis.set_title(f"Tasa de compra según {category}")
            rate_axis.set_xlabel("Porcentaje de sesiones con compra")
        figure.suptitle(
            "ShopPredict · Diagnóstico de sesiones",
            fontsize=15,
            fontweight="bold",
        )
        figure.tight_layout()
        figure.savefig(path, bbox_inches="tight")

    def save_metrics_figure(self, path: Path) -> None:
        labels = ["Accuracy", "Balanced accuracy", "Precision", "Recall", "F1", "ROC-AUC"]
        keys = ["accuracy", "balanced_accuracy", "precision", "recall", "f1", "roc_auc"]
        figure = Figure(figsize=(10, 5.8), dpi=160, facecolor="white")
        axis = figure.add_subplot(111)
        x = np.arange(len(labels))
        width = 0.23
        colors = ["#0EA5E9", "#10B981", "#F59E0B"]
        for index, result in enumerate(self.model_results):
            values = [float(result[key]) for key in keys]
            bars = axis.bar(
                x + (index - 1) * width,
                values,
                width,
                label=str(result["name"]),
                color=colors[index],
            )
            axis.bar_label(bars, fmt="%.2f", fontsize=7, padding=2)
        axis.set_xticks(x, labels)
        axis.set_ylim(0, 1.15)
        axis.set_ylabel("Puntaje")
        axis.set_title("Comparación de modelos · mismo conjunto de prueba")
        axis.legend(loc="lower right")
        axis.grid(axis="y", alpha=0.2)
        figure.tight_layout()
        figure.savefig(path, bbox_inches="tight")

    @staticmethod
    def save_confusion_figure(result: dict[str, object], path: Path) -> None:
        matrix = np.asarray(result["confusion"])
        figure = Figure(figsize=(6.2, 5.4), dpi=160, facecolor="white")
        axis = figure.add_subplot(111)
        image = axis.imshow(matrix, cmap="Blues")
        axis.set_title(f"Matriz de confusión · {result['name']}")
        axis.set_xticks([0, 1], ["Sin compra", "Compra"])
        axis.set_yticks([0, 1], ["Sin compra", "Compra"])
        axis.set_xlabel("Predicción")
        axis.set_ylabel("Valor real")
        threshold = matrix.max() / 2 if matrix.size else 0
        for row in range(2):
            for column in range(2):
                axis.text(
                    column,
                    row,
                    f"{matrix[row, column]:,}",
                    ha="center",
                    va="center",
                    color="white" if matrix[row, column] > threshold else "#0F172A",
                    fontweight="bold",
                    fontsize=12,
                )
        figure.colorbar(image, ax=axis)
        figure.tight_layout()
        figure.savefig(path, bbox_inches="tight")


if __name__ == "__main__":
    root = tk.Tk()
    app = ShopPredictApp(root)
    root.mainloop()
