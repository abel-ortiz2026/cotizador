document.addEventListener('DOMContentLoaded', () => {

    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTeciveu_jyLNV4RZrGhyJNzbiWUMNLz3paNSxhB3NncLq2YLLzl3eCbW5wPC27gA/pub?gid=679410401&single=true&output=csv';

    // Elementos del DOM
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

    let vehiculosData = {};

    // Limpieza de comillas y espacios extras del CSV
    const cleanText = (str) => {
        if (!str) return "";
        return str.toString().replace(/^["'\s]+|["'\s]+$/g, '').trim();
    };

    // Clasificación de categoría por nombre de modelo/unidad
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

    // Parser manual para no romper cadenas con comas dentro de comillas
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

        // Índices de columnas dinámicos
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

            // Detectar automáticamente en qué columna está cada cabecera
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

            // Omitir hasta haber localizado las cabeceras
            if (idxUnidad === -1 || idxMensualidad === -1) continue;

            const unidadVal = cols[idxUnidad] ? cols[idxUnidad].toUpperCase() : "";
            const versionVal = cols[idxVersion] ? cols[idxVersion].toUpperCase() : "";
            const tasaVal = cols[idxTasa] || "";
            const engancheVal = cols[idxEnganche] || "";
            const plazoVal = cols[idxPlazo] || "";
            const mensualidadVal = cols[idxMensualidad] || "";
            const precioVal = cols[idxPrecio] || "";
            const observacionVal = cols[idxObservacion] || "";

            // Preservar valores de celdas combinadas verticalmente
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
            console.error("Error al cargar datos desde Google Sheets:", err);
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
        selectUnidad.innerHTML = '<option value="">-- SELECCIONA UNIDAD --</option>';

        if (vehiculosData[tipoSeleccionado]) {
            const unidades = Object.keys(vehiculosData[tipoSeleccionado]);
            unidades.forEach(unidad => {
                const opt = document.createElement('option');
                opt.value = unidad;
                opt.textContent = unidad;
                selectUnidad.appendChild(opt);
            });

            // Si existen unidades para la categoría, seleccionar automáticamente la primera
            if (unidades.length > 0) {
                selectUnidad.value = unidades[0];
            }
        }

        cargarVersiones();
    };

    const cargarVersiones = () => {
        if (!selectVersion) return;
        const tipoSeleccionado = selectTipo.value;
        const unidadSeleccionada = selectUnidad.value;

        selectVersion.innerHTML = '<option value="">-- SELECCIONA VERSIÓN --</option>';

        if (vehiculosData[tipoSeleccionado]?.[unidadSeleccionada]) {
            const versiones = Object.keys(vehiculosData[tipoSeleccionado][unidadSeleccionada]);
            versiones.forEach(version => {
                const opt = document.createElement('option');
                opt.value = version;
                opt.textContent = version;
                selectVersion.appendChild(opt);
            });

            // Seleccionar la primera versión por defecto si existe
            if (versiones.length > 0) {
                selectVersion.value = versiones[0];
            }
        }

        cargarEnganches();
    };

    const cargarEnganches = () => {
        if (!selectEnganche) return;
        const tipoSeleccionado = selectTipo.value;
        const unidadSeleccionada = selectUnidad.value;
        const versionSeleccionada = selectVersion.value;

        selectEnganche.innerHTML = '<option value="">-- SELECCIONA ENGANCHE --</option>';

        const info = vehiculosData[tipoSeleccionado]?.[unidadSeleccionada]?.[versionSeleccionada];
        if (info && info.enganchesMap) {
            const enganches = Object.keys(info.enganchesMap);
            enganches.forEach(montoEnganche => {
                const opt = document.createElement('option');
                opt.value = montoEnganche;
                opt.textContent = montoEnganche;
                selectEnganche.appendChild(opt);
            });

            // Seleccionar el primer enganche por defecto
            if (enganches.length > 0) {
                selectEnganche.value = enganches[0];
            }
        }

        actualizarCalculos();
    };

    const actualizarCalculos = () => {
        if (!selectTipo || !selectUnidad || !selectVersion || !selectEnganche) return;

        const tipo = selectTipo.value;
        const unidad = selectUnidad.value;
        const version = selectVersion.value;
        const engancheKey = selectEnganche.value;

        // Si no hay datos seleccionados, reiniciar vista
        if (!unidad || !version || !vehiculosData[tipo]?.[unidad]?.[version]) {
            if (precioListaEl) precioListaEl.innerText = "$0.00";
            if (mesRows) {
                mesRows.forEach(row => row.innerText = "$0.00");
            }
            return;
        }

        const info = vehiculosData[tipo][unidad][version];
        
        // Actualizar precio de lista
        if (precioListaEl) {
            precioListaEl.innerText = info.precio || "$0.00";
        }

        // Actualizar tabla de plazos (72, 60, 48, 36 meses)
        const plazosMap = info.enganchesMap?.[engancheKey] || {};
        const plazos = ["72", "60", "48", "36"];

        plazos.forEach((plazoKey, index) => {
            const valorMensualidad = plazosMap[plazoKey] || "$0.00";
            if (mesRows[index]) {
                mesRows[index].innerText = valorMensualidad;
            }
        });
    };

    // Registros de eventos de cambio en los selects
    if (selectTipo) selectTipo.addEventListener('change', cargarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', cargarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', cargarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarCalculos);

    // Inicializar carga de datos
    cargarDatos();
});