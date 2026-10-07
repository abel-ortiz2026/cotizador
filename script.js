document.addEventListener('DOMContentLoaded', () => {

    // URL oficial del CSV con control anti-caché
    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTeciveu_jyLNV4RZrGhyJNzbiWUMNLz3paNSxhB3NncLq2YLLzl3eCbW5wPC27gA/pub?gid=679410401&single=true&output=csv&_t=' + Date.now();

    const selectTipo = document.getElementById('select-tipo');
    const selectUnidad = document.getElementById('select-unidad');
    const selectVersion = document.getElementById('select-version');
    const selectEnganche = document.getElementById('select-enganche');
    const precioListaEl = document.getElementById('precio-lista');
    const mesRows = document.querySelectorAll('.mes-row strong');

    let vehiculosData = {
        "AUTOMÓVIL": {},
        "SUV": {},
        "HÍBRIDOS Y ELÉCTRICOS": {}
    };

    const cleanText = (str) => {
        if (!str) return "";
        return str.toString().replace(/^["'\s]+|["'\s]+$/g, '').trim();
    };

    const obtenerTipoPorUnidad = (unidad) => {
        const u = unidad.toUpperCase();
        if (u.includes("NIRO") || u.includes("EV3") || u.includes("EV6") || u.includes("EV9") || u.includes("HEV") || u.includes("HIBRID") || u.includes("ELECTRICO")) {
            return "HÍBRIDOS Y ELÉCTRICOS";
        }
        if (u.includes("SONET") || u.includes("SELTOS") || u.includes("SPORTAGE") || u.includes("SORENTO") || u.includes("TELLURIDE") || u.includes("SOUL") || u.includes("SUV")) {
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

    const parsearCSVTexto = (text) => {
        const lines = text.split(/\r\n|\n/);
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

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = parseCSVLine(line);
            if (cols.length < 8) continue;

            const lineUpper = line.toUpperCase();
            if (lineUpper.includes("COTIZACIONES") || lineUpper.includes("VERSION") || lineUpper.includes("MENSUALIDAD")) {
                continue;
            }

            const unidadVal = cols[2] || "";
            const versionVal = cols[3] || "";
            const tasaVal = cols[4] || "";
            const engancheVal = cols[5] || "";
            const plazoVal = cols[6] || "";
            const mensualidadVal = cols[7] || "";
            const precioVal = cols[8] || "";

            if (unidadVal && !unidadVal.toUpperCase().includes("COTIZACION")) lastUnidad = unidadVal.toUpperCase();
            if (versionVal && !versionVal.toUpperCase().includes("VERSION")) lastVersion = versionVal.toUpperCase();
            if (tasaVal && !tasaVal.toUpperCase().includes("TASA")) lastTasa = tasaVal;
            if (engancheVal && !engancheVal.toUpperCase().includes("ENGANCHE")) lastEnganche = engancheVal;
            if (precioVal && !precioVal.toUpperCase().includes("PRECIO") && precioVal.length > 2) lastPrecio = precioVal;

            if (!lastUnidad || !lastVersion || !lastEnganche || !plazoVal || !mensualidadVal) {
                continue;
            }

            const tipo = obtenerTipoPorUnidad(lastUnidad);

            if (!data[tipo]) data[tipo] = {};
            if (!data[tipo][lastUnidad]) data[tipo][lastUnidad] = {};
            if (!data[tipo][lastUnidad][lastVersion]) {
                data[tipo][lastUnidad][lastVersion] = {
                    precio: lastPrecio || "$0.00",
                    tasa: lastTasa || "12.99%",
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
            const response = await fetch(SHEET_CSV_URL);
            if (response.ok) {
                const text = await response.text();
                const resultado = parsearCSVTexto(text);
                if (Object.keys(resultado["AUTOMÓVIL"]).length > 0 || Object.keys(resultado["SUV"]).length > 0) {
                    vehiculosData = resultado;
                }
            }
        } catch (err) {
            console.error("Error al obtener datos del CSV:", err);
        }

        poblarSelectTipos();
    };

    const poblarSelectTipos = () => {
        if (!selectTipo) return;
        selectTipo.innerHTML = '';
        const categorias = Object.keys(vehiculosData);

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

        const unidades = vehiculosData[tipoSeleccionado] ? Object.keys(vehiculosData[tipoSeleccionado]) : [];
        
        if (unidades.length === 0) {
            const opt = document.createElement('option');
            opt.value = "";
            opt.textContent = "No hay unidades disponibles";
            selectUnidad.appendChild(opt);
        } else {
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

        const versiones = vehiculosData[tipoSeleccionado]?.[unidadSeleccionada] ? Object.keys(vehiculosData[tipoSeleccionado][unidadSeleccionada]) : [];

        if (versiones.length === 0) {
            const opt = document.createElement('option');
            opt.value = "";
            opt.textContent = "Sin versiones";
            selectVersion.appendChild(opt);
        } else {
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
        const enganches = (info && info.enganchesMap) ? Object.keys(info.enganchesMap) : [];

        if (enganches.length === 0) {
            const opt = document.createElement('option');
            opt.value = "";
            opt.textContent = "Sin enganches";
            selectEnganche.appendChild(opt);
        } else {
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

        const info = vehiculosData[tipo]?.[unidad]?.[version];
        if (!info) {
            if (precioListaEl) precioListaEl.innerText = "$0.00";
            if (mesRows) mesRows.forEach(row => row.innerText = "$0.00");
            return;
        }

        if (precioListaEl) {
            precioListaEl.innerText = info.precio || "$0.00";
        }

        const plazosMap = info.enganchesMap?.[engancheKey] || {};
        const plazos = ["72", "60", "48", "36"];

        plazos.forEach((plazoKey, index) => {
            const valorMensualidad = plazosMap[plazoKey] || "$0.00";
            if (mesRows[index]) {
                mesRows[index].innerText = valorMensualidad;
            }
        });
    };

    // Eventos de cambio interconectados correctamente
    if (selectTipo) selectTipo.addEventListener('change', cargarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', cargarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', cargarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarCalculos);

    // Carga inicial
    cargarDatos();
});
