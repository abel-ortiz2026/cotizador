document.addEventListener('DOMContentLoaded', () => {

    // URL del CSV publicado en Google Sheets
    const BASE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTeciveu_jyLNV4RZrGhyJNzbiWUMNLz3paNSxhB3NncLq2YLLzl3eCbW5wPC27gA/pub?gid=679410401&single=true&output=csv';

    // Elementos DOM
    const selectTipo = document.getElementById('select-tipo');
    const selectUnidad = document.getElementById('select-unidad');
    const selectVersion = document.getElementById('select-version');
    const selectEnganche = document.getElementById('select-enganche');
    const precioListaEl = document.getElementById('precio-lista');
    const mesRows = document.querySelectorAll('.mes-row strong');

    let vehiculosData = {};

    const clean = (val) => {
        if (!val) return "";
        return val.toString().replace(/^["'\s]+|["'\s]+\$/g, '').trim();
    };

    // Parser CSV con soporte para comas dentro de comillas
    const parseCSVLine = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(clean(cur));
                cur = '';
            } else {
                cur += char;
            }
        }
        result.push(clean(cur));
        return result;
    };

    // Clasificación de categorías según la unidad encontrada
    const obtenerTipoPorUnidad = (unidad) => {
        const u = unidad.toUpperCase();

        if (
            u.includes("EV3") || u.includes("EV6") || u.includes("EV9") || 
            u.includes("NIRO") || u.includes("HEV") || u.includes("HIBRID") || u.includes("ELECTRICO")
        ) {
            return "HÍBRIDOS Y ELÉCTRICOS";
        }

        if (
            u.includes("SONET") || u.includes("SELTOS") || u.includes("SPORTAGE") || 
            u.includes("SORENTO") || u.includes("TELLURIDE") || u.includes("SOUL") ||
            u.includes("SUV")
        ) {
            return "SUV";
        }

        return "AUTOMÓVIL";
    };

    const parseCSV = (csvText) => {
        const lines = csvText.split(/\r\n|\n/);
        const data = {
            "AUTOMÓVIL": {},
            "SUV": {},
            "HÍBRIDOS Y ELÉCTRICOS": {}
        };

        // Posiciones directas según la estructura de tu hoja (Col C a Col I)
        const idxUnidad = 2;      // Col C: COTIZACIONES
        const idxVersion = 3;     // Col D: VERSION
        const idxTasa = 4;        // Col E: TASA
        const idxEnganche = 5;    // Col F: ENGANCHE
        const idxPlazo = 6;       // Col G: PLAZO
        const idxMensualidad = 7; // Col H: MENSUALIDAD
        const idxPrecio = 8;      // Col I: PRECIO

        // Memoria para rellenar celdas combinadas de Google Sheets
        let lastUnidad = "";
        let lastVersion = "";
        let lastTasa = "";
        let lastEnganche = "";
        let lastPrecio = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = parseCSVLine(line);
            const lineUpper = line.toUpperCase();

            // Omitir filas de títulos o encabezados
            if (lineUpper.includes("COTIZACIONES") || lineUpper.includes("VERSION") || lineUpper.includes("MENSUALIDAD")) {
                continue;
            }

            const unidadVal = cols[idxUnidad] || "";
            const versionVal = cols[idxVersion] || "";
            const tasaVal = cols[idxTasa] || "";
            const engancheVal = cols[idxEnganche] || "";
            const plazoVal = cols[idxPlazo] || "";
            const mensualidadVal = cols[idxMensualidad] || "";
            const precioVal = cols[idxPrecio] || "";

            // Retener el último valor visto cuando las celdas vienen combinadas/vacías
            if (unidadVal) lastUnidad = unidadVal.toUpperCase();
            if (versionVal) lastVersion = versionVal.toUpperCase();
            if (tasaVal) lastTasa = tasaVal;
            if (engancheVal) lastEnganche = engancheVal;
            if (precioVal) lastPrecio = precioVal;

            if (!lastUnidad || !lastVersion || !lastEnganche || !plazoVal || !mensualidadVal) {
                continue;
            }

            const tipo = obtenerTipoPorUnidad(lastUnidad);

            if (!data[tipo]) data[tipo] = {};
            if (!data[tipo][lastUnidad]) data[tipo][lastUnidad] = {};
            if (!data[tipo][lastUnidad][lastVersion]) {
                data[tipo][lastUnidad][lastVersion] = {
                    precio: lastPrecio,
                    tasa: lastTasa,
                    enganchesMap: {}
                };
            }

            if (lastPrecio) {
                data[tipo][lastUnidad][lastVersion].precio = lastPrecio;
            }

            const engMap = data[tipo][lastUnidad][lastVersion].enganchesMap;
            if (!engMap[lastEnganche]) {
                engMap[lastEnganche] = {};
            }

            const plazoNum = plazoVal.replace(/[^0-9]/g, '');
            if (plazoNum) {
                engMap[lastEnganche][plazoNum] = mensualidadVal;
            }
        }

        return data;
    };

    const cargarDatos = async () => {
        try {
            const urlAntiCache = `${BASE_CSV_URL}&_nocache=${Date.now()}`;
            const response = await fetch(urlAntiCache);
            if (response.ok) {
                const text = await response.text();
                vehiculosData = parseCSV(text);
                poblarSelectTipos();
            }
        } catch (err) {
            console.error("Error al cargar el CSV de Google Sheets:", err);
        }
    };

    const poblarSelectTipos = () => {
        if (!selectTipo) return;
        selectTipo.innerHTML = '';

        const categorias = ["AUTOMÓVIL", "SUV", "HÍBRIDOS Y ELÉCTRICOS"];

        categorias.forEach(tipo => {
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
            const unidades = Object.keys(vehiculosData[tipoSeleccionado]);
            unidades.forEach(unidad => {
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
            const versiones = Object.keys(vehiculosData[tipoSeleccionado][unidadSeleccionada]);
            versiones.forEach(version => {
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
            const enganches = Object.keys(info.enganchesMap);
            enganches.forEach(montoEnganche => {
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

        if (!vehiculosData[tipo]?.[unidad]?.[version]) {
            if (precioListaEl) precioListaEl.innerText = "\$0.00";
            if (mesRows) mesRows.forEach(row => row.innerText = "\$0.00");
            return;
        }

        const info = vehiculosData[tipo][unidad][version];
        
        if (precioListaEl) {
            precioListaEl.innerText = info.precio || "\$0.00";
        }

        const plazosMap = info.enganchesMap?.[engancheKey] || {};
        const plazos = ["72", "60", "48", "36"];

        plazos.forEach((plazoKey, index) => {
            const valorMensualidad = plazosMap[plazoKey] || "\$0.00";
            if (mesRows[index]) {
                mesRows[index].innerText = valorMensualidad;
            }
        });
    };

    if (selectTipo) selectTipo.addEventListener('change', cargarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', cargarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', cargarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarCalculos);

    cargarDatos();
});