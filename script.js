document.addEventListener('DOMContentLoaded', () => {

    // URL con timestamp dinámico para bypass completo de caché en Google Sheets
    const GET_FRESH_CSV_URL = () => {
        const baseUrl = 'https://script.google.com/macros/s/AKfycbwwV36j2P-8HlYavptj5803J6dXpSkbONDug-Unth8GMcihZrAmzlaCw5Fp-gAqEo-9kg/exec`;
    };

    const selectTipo = document.getElementById('select-tipo');
    const selectUnidad = document.getElementById('select-unidad');
    const selectVersion = document.getElementById('select-version');
    const selectEnganche = document.getElementById('select-enganche');
    const precioListaEl = document.getElementById('precio-lista');
    const mesRows = document.querySelectorAll('.mes-row strong');

    let vehiculosData = {};

    const cleanText = (str) => {
        if (!str) return "";
        return str.toString().replace(/^["'\s]+|["'\s]+\$/g, '').trim();
    };

    // Mapeo flexible de unidades a categorías
    const obtenerTipoPorUnidad = (unidad) => {
        const u = unidad.toUpperCase();

        if (
            u.includes("NIRO") || u.includes("EV3") || u.includes("EV6") || 
            u.includes("EV9") || u.includes("HEV") || u.includes("HIBRID") || 
            u.includes("ELECTRICO")
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
            const lineUpper = line.toUpperCase();

            // Descartar encabezados
            if (lineUpper.includes("COTIZACIONES") || lineUpper.includes("VERSION") || lineUpper.includes("MENSUALIDAD")) {
                continue;
            }

            // Col C (2) = UNIDAD | Col D (3) = VERSION | Col E (4) = TASA | Col F (5) = ENGANCHE
            // Col G (6) = PLAZO  | Col H (7) = MENSUALIDAD | Col I (8) = PRECIO | Col J (9) = OBSERVACION
            const unidadVal = cols[2] || "";
            const versionVal = cols[3] || "";
            const tasaVal = cols[4] || "";
            const engancheVal = cols[5] || "";
            const plazoVal = cols[6] || "";
            const mensualidadVal = cols[7] || "";
            const precioVal = cols[8] || "";
            const observacionVal = cols[9] || "";

            if (unidadVal && !unidadVal.includes("COTIZACION")) lastUnidad = unidadVal.toUpperCase();
            if (versionVal && !versionVal.includes("VERSION")) lastVersion = versionVal.toUpperCase();
            if (tasaVal && !tasaVal.includes("TASA")) lastTasa = tasaVal;
            if (engancheVal && !engancheVal.includes("ENGANCHE")) lastEnganche = engancheVal;
            if (precioVal && !precioVal.includes("PRECIO")) lastPrecio = precioVal;
            if (observacionVal && !observacionVal.includes("OBSERVACION")) lastObservacion = observacionVal;

            if (!lastUnidad || !lastVersion || !lastEnganche || !plazoVal || !mensualidadVal) {
                continue;
            }

            const tipo = obtenerTipoPorUnidad(lastUnidad);

            if (!data[tipo]) data[tipo] = {};
            if (!data[tipo][lastUnidad]) data[tipo][lastUnidad] = {};
            if (!data[tipo][lastUnidad][lastVersion]) {
                data[tipo][lastUnidad][lastVersion] = {
                    precio: lastPrecio || "\$750,000.00",
                    tasa: lastTasa,
                    observacion: lastObservacion,
                    enganchesMap: {}
                };
            }

            if (lastPrecio && !data[tipo][lastUnidad][lastVersion].precio) {
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
            const response = await fetch(GET_FRESH_CSV_URL(), { cache: 'no-store' });
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
            precioListaEl.innerText = info.precio || "\$750,000.00";
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
