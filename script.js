document.addEventListener('DOMContentLoaded', () => {

    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTeciveu_jyLNV4RZrGhyJNzbiWUMNLz3paNSxhB3NncLq2YLLzl3eCbW5wPC27gA/pub?gid=679410401&single=true&output=csv';

    // Elementos DOM
    const selectTipo = document.getElementById('select-tipo');
    const selectUnidad = document.getElementById('select-unidad');
    const selectVersion = document.getElementById('select-version');
    const selectEnganche = document.getElementById('select-enganche');
    const precioListaEl = document.getElementById('precio-lista');
    const mesRows = document.querySelectorAll('.mes-row strong');

    // Botones e Interfaz
    const btnContact = document.getElementById('btn-contact');
    const modal = document.getElementById('contact-modal');
    const btnClose = document.getElementById('close-modal');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnEmail = document.getElementById('btn-email');
    const btnPdfModal = document.getElementById('btn-pdf-modal');
    const btnPdfMain = document.getElementById('btn-pdf-main');

    let vehiculosData = {};

    const cleanText = (str) => {
        if (!str) return "";
        return str.toString().replace(/^["'\s]+|["'\s]+$/g, '').trim();
    };

    // Clasificación por tipo de unidad
    const obtenerTipoPorUnidad = (unidad) => {
        const u = unidad.toUpperCase();

        if (
            u.includes("EV3") || 
            u.includes("EV6") || 
            u.includes("EV9") || 
            u.includes("NIRO") || 
            u.includes("HEV") || 
            u.includes("HIBRID") || 
            u.includes("ELECTRICO")
        ) {
            return "HÍBRIDOS Y ELÉCTRICOS";
        }

        if (
            u.includes("SONET") || 
            u.includes("SELTOS") || 
            u.includes("SPORTAGE") || 
            u.includes("SORENTO") || 
            u.includes("TELLURIDE") || 
            u.includes("SOUL")
        ) {
            return "SUV";
        }

        return "AUTOMÓVIL";
    };

    // Función para parsear CSV respetando comillas y comas internas
    const parseCSVLine = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(cleanText(cur));
                cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cleanText(cur));
        return result;
    };

    const parseCSV = (csvText) => {
        const lines = csvText.split(/\r\n|\n/);
        const data = {
            "AUTOMÓVIL": {},
            "SUV": {},
            "HÍBRIDOS Y ELÉCTRICOS": {}
        };

        // Índices dinámicos
        let idxUnidad = -1;
        let idxVersion = -1;
        let idxTasa = -1;
        let idxEnganche = -1;
        let idxPlazo = -1;
        let idxMensualidad = -1;
        let idxPrecio = -1;
        let idxObservacion = -1;

        let currentUnidad = "";
        let currentVersion = "";
        let currentTasa = "";
        let currentEnganche = "";
        let currentPrecio = "";
        let currentObservacion = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = parseCSVLine(line);
            const lineUpper = line.toUpperCase();

            // Detectar los encabezados dinámicamente sin importar en qué columna estén
            if (lineUpper.includes("COTIZACIONES") && lineUpper.includes("MENSUALIDAD")) {
                cols.forEach((colHeader, idx) => {
                    const h = colHeader.toUpperCase();
                    if (h.includes("COTIZACION") || h.includes("UNIDAD")) idxUnidad = idx;
                    if (h.includes("VERSION")) idxVersion = idx;
                    if (h.includes("TASA")) idxTasa = idx;
                    if (h.includes("ENGANCHE")) idxEnganche = idx;
                    if (h.includes("PLAZO")) idxPlazo = idx;
                    if (h.includes("MENSUALIDAD")) idxMensualidad = idx;
                    if (h.includes("PRECIO")) idxPrecio = idx;
                    if (h.includes("OBSERVACION")) idxObservacion = idx;
                });
                continue;
            }

            // Si aún no ha encontrado los encabezados, no procesa la fila
            if (idxUnidad === -1 || idxMensualidad === -1) continue;

            const unidadVal = cols[idxUnidad] ? cols[idxUnidad].toUpperCase() : "";
            const versionVal = cols[idxVersion] ? cols[idxVersion].toUpperCase() : "";
            const tasaVal = cols[idxTasa] || "";
            const engancheVal = cols[idxEnganche] || "";
            const plazoVal = cols[idxPlazo] || "";
            const mensualidadVal = cols[idxMensualidad] || "";
            const precioVal = cols[idxPrecio] || "";
            const observacionVal = cols[idxObservacion] || "";

            // Mantener valores de celdas combinadas
            if (unidadVal && !unidadVal.includes("COTIZACION")) currentUnidad = unidadVal;
            if (versionVal && !versionVal.includes("VERSION")) currentVersion = versionVal;
            if (tasaVal && !tasaVal.includes("TASA")) currentTasa = tasaVal;
            if (engancheVal && !engancheVal.includes("ENGANCHE")) currentEnganche = engancheVal;
            if (precioVal && !precioVal.includes("PRECIO")) currentPrecio = precioVal;
            if (observacionVal && !observacionVal.includes("OBSERVACION")) currentObservacion = observacionVal;

            if (!currentUnidad || !currentVersion || !currentEnganche || !plazoVal || !mensualidadVal) {
                continue;
            }

            const tipo = obtenerTipoPorUnidad(currentUnidad);

            if (!data[tipo]) data[tipo] = {};
            if (!data[tipo][currentUnidad]) data[tipo][currentUnidad] = {};
            if (!data[tipo][currentUnidad][currentVersion]) {
                data[tipo][currentUnidad][currentVersion] = {
                    precio: currentPrecio,
                    tasa: currentTasa,
                    observacion: currentObservacion,
                    enganchesMap: {}
                };
            }

            if (currentPrecio) data[tipo][currentUnidad][currentVersion].precio = currentPrecio;
            if (currentTasa) data[tipo][currentUnidad][currentVersion].tasa = currentTasa;
            if (currentObservacion) data[tipo][currentUnidad][currentVersion].observacion = currentObservacion;

            const engMap = data[tipo][currentUnidad][currentVersion].enganchesMap;
            if (!engMap[currentEnganche]) {
                engMap[currentEnganche] = {};
            }

            const plazoNum = plazoVal.replace(/[^0-9]/g, '');
            if (plazoNum) {
                engMap[currentEnganche][plazoNum] = mensualidadVal;
            }
        }

        return data;
    };

    const cargarDatos = async () => {
        try {
            const urlAntiCache = `${SHEET_CSV_URL}&_v=${Date.now()}`;
            const response = await fetch(urlAntiCache);
            if (response.ok) {
                const text = await response.text();
                vehiculosData = parseCSV(text);
                poblarSelectTipos();
            }
        } catch (err) {
            console.error("Error al cargar datos:", err);
        }
    };

    const poblarSelectTipos = () => {
        if (!selectTipo) return;
        selectTipo.innerHTML = '';

        const categoriasFijas = ["AUTOMÓVIL", "SUV", "HÍBRIDOS Y ELÉCTRICOS"];

        categoriasFijas.forEach(tipo => {
            const opt = document.createElement('option');
            opt.value = tipo;
            opt.textContent = tipo;
            selectTipo.appendChild(opt);
        });

        cargarUnidades();
    };

    const cargarUnidades = () => {
        if (!selectUnidad) return;
        const tipoSeleccionado = selectTipo.value;
        selectUnidad.innerHTML = '';

        if (vehiculosData[tipoSeleccionado]) {
            Object.keys(vehiculosData[tipoSeleccionado]).forEach(unidad => {
                const opt = document.createElement('option');
                opt.value = unidad;
                opt.textContent = unidad;
                selectUnidad.appendChild(opt);
            });
        }
        cargarVersiones();
    };

    const cargarVersiones = () => {
        if (!selectVersion) return;
        const tipoSeleccionado = selectTipo.value;
        const unidadSeleccionada = selectUnidad.value;
        selectVersion.innerHTML = '';

        if (vehiculosData[tipoSeleccionado]?.[unidadSeleccionada]) {
            Object.keys(vehiculosData[tipoSeleccionado][unidadSeleccionada]).forEach(version => {
                const opt = document.createElement('option');
                opt.value = version;
                opt.textContent = version;
                selectVersion.appendChild(opt);
            });
        }
        cargarEnganches();
    };

    const cargarEnganches = () => {
        if (!selectEnganche) return;
        const tipoSeleccionado = selectTipo.value;
        const unidadSeleccionada = selectUnidad.value;
        const versionSeleccionada = selectVersion.value;

        selectEnganche.innerHTML = '';

        const info = vehiculosData[tipoSeleccionado]?.[unidadSeleccionada]?.[versionSeleccionada];
        if (info && info.enganchesMap) {
            Object.keys(info.enganchesMap).forEach(montoEnganche => {
                const opt = document.createElement('option');
                opt.value = montoEnganche;
                opt.textContent = montoEnganche;
                selectEnganche.appendChild(opt);
            });
        }
        actualizarCalculos();
    };

    const actualizarCalculos = () => {
        if (!selectTipo || !selectUnidad || !selectVersion || !selectEnganche) return;

        const tipo = selectTipo.value;
        const unidad = selectUnidad.value;
        const version = selectVersion.value;
        const engancheKey = selectEnganche.value;

        if (!vehiculosData[tipo]?.[unidad]?.[version]) return;

        const info = vehiculosData[tipo][unidad][version];
        
        if (precioListaEl) precioListaEl.innerText = info.precio || "$0.00";

        const plazosMap = info.enganchesMap?.[engancheKey] || {};
        const plazos = ["72", "60", "48", "36"];
        let mensualidad48 = "$0.00";

        plazos.forEach((plazoKey, index) => {
            const valorMensualidad = plazosMap[plazoKey] || "$0.00";
            if (plazoKey === "48") mensualidad48 = valorMensualidad;
            if (mesRows[index]) {
                mesRows[index].innerText = valorMensualidad;
            }
        });
    };

    // Eventos
    if (selectTipo) selectTipo.addEventListener('change', cargarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', cargarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', cargarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarCalculos);

    // Inicializar
    cargarDatos();
});