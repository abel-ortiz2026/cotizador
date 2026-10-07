document.addEventListener('DOMContentLoaded', () => {

    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTeciveu_jyLNV4RZrGhyJNzbiWUMNLz3paNSxhB3NncLq2YLLzl3eCbW5wPC27gA/pub?gid=679410401&single=true&output=csv';

    // Elementos del DOM
    const selectTipo = document.getElementById('select-tipo');
    const selectUnidad = document.getElementById('select-unidad');
    const selectVersion = document.getElementById('select-version');
    const selectEnganche = document.getElementById('select-enganche');
    const precioListaEl = document.getElementById('precio-lista');
    const mesRows = document.querySelectorAll('.mes-row strong');

    let vehiculosData = {};

    // Limpiar comillas y espacios de los valores del CSV
    const clean = (val) => {
        if (!val) return "";
        return val.toString().replace(/^["'\s]+|["'\s]+\$/g, '').trim();
    };

    // Clasificar categoría según el modelo
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
            u.includes("SORENTO") || u.includes("TELLURIDE") || u.includes("SOUL")
        ) {
            return "SUV";
        }

        return "AUTOMÓVIL";
    };

    // Parser manual para no romper montos con comas como "\$750,000.00"
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

    const parseCSV = (csvText) => {
        const lines = csvText.split(/\r\n|\n/);
        const data = {
            "AUTOMÓVIL": {},
            "SUV": {},
            "HÍBRIDOS Y ELÉCTRICOS": {}
        };

        // Celdas combinadas: mantenemos memoria del último valor visto
        let lastUnidad = "";
        let lastVersion = "";
        let lastTasa = "";
        let lastEnganche = "";
        let lastPrecio = "";
        let lastObservacion = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = parseCSVLine(line);

            // Ignorar la fila de cabecera (Fila 2 del Excel)
            const lineUpper = line.toUpperCase();
            if (lineUpper.includes("COTIZACIONES") || lineUpper.includes("VERSION") || lineUpper.includes("MENSUALIDAD")) {
                continue;
            }

            // Estructura según tu foto (Columnas A y B vacías -> C es posición 2):
            // Pos 2 (Col C): COTIZACIONES (Unidad)
            // Pos 3 (Col D): VERSION
            // Pos 4 (Col E): TASA
            // Pos 5 (Col F): ENGANCHE
            // Pos 6 (Col G): PLAZO
            // Pos 7 (Col H): MENSUALIDAD
            // Pos 8 (Col I): PRECIO
            // Pos 9 (Col J): OBSERVACION

            const unidadVal = cols[2] || "";
            const versionVal = cols[3] || "";
            const tasaVal = cols[4] || "";
            const engancheVal = cols[5] || "";
            const plazoVal = cols[6] || "";
            const mensualidadVal = cols[7] || "";
            const precioVal = cols[8] || "";
            const observacionVal = cols[9] || "";

            // Si la celda trae valor, actualizamos. Si viene vacía (celda combinada), usamos el anterior.
            if (unidadVal) lastUnidad = unidadVal.toUpperCase();
            if (versionVal) lastVersion = versionVal.toUpperCase();
            if (tasaVal) lastTasa = tasaVal;
            if (engancheVal) lastEnganche = engancheVal;
            if (precioVal) lastPrecio = precioVal;
            if (observacionVal) lastObservacion = observacionVal;

            // Si no hay unidad, versión o plazo/mensualidad, saltamos la fila
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
                    observacion: lastObservacion,
                    enganchesMap: {}
                };
            }

            if (lastPrecio) data[tipo][lastUnidad][lastVersion].precio = lastPrecio;
            if (lastTasa) data[tipo][lastUnidad][lastVersion].tasa = lastTasa;
            if (lastObservacion) data[tipo][lastUnidad][lastVersion].observacion = lastObservacion;

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
            const urlAntiCache = `${SHEET_CSV_URL}&_v=${Date.now()}`;
            const response = await fetch(urlAntiCache);
            if (response.ok) {
                const text = await response.text();
                vehiculosData = parseCSV(text);
                poblarSelectTipos();
            }
        } catch (err) {
            console.error("Error al cargar CSV:", err);
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

    // Eventos
    if (selectTipo) selectTipo.addEventListener('change', cargarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', cargarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', cargarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarCalculos);

    // Inicializar
    cargarDatos();
});