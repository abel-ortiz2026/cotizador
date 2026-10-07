document.addEventListener('DOMContentLoaded', () => {

    // URL oficial directa de tu hoja publicada como CSV
    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTeciveu_jyLNV4RZrGhyJNzbiWUMNLz3paNSxhB3NncLq2YLLzl3eCbW5wPC27gA/pub?gid=679410401&single=true&output=csv&t=' + Date.now();

    const selectTipo = document.getElementById('select-tipo');
    const selectUnidad = document.getElementById('select-unidad');
    const selectVersion = document.getElementById('select-version');
    const selectEnganche = document.getElementById('select-enganche');
    const precioListaEl = document.getElementById('precio-lista');
    const mesRows = document.querySelectorAll('.mes-row strong');

    let vehiculosData = {};

    const cleanText = (str) => {
        if (!str) return "";
        return str.toString().replace(/^["'\s]+|["'\s]+$/g, '').trim();
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
            "AUTOMÓVIL": {
                "K3 SEDAN": {
                    "L TM": {
                        precio: "$750,000.00",
                        tasa: "12.99%",
                        enganchesMap: {
                            "$63,511.95": { "72": "$5,197.51", "60": "$5,841.95", "48": "$6,826.91", "36": "$8,493.94" },
                            "$92,989.79": { "72": "$4,547.82", "60": "$5,111.62", "48": "$5,973.55", "36": "$7,432.19" }
                        }
                    },
                    "LX TM": {
                        precio: "$358,800.00",
                        tasa: "12.99%",
                        enganchesMap: {
                            "$56,690.50": { "72": "$6,112.31", "60": "$6,870.06", "48": "$8,028.51", "36": "$9,988.94" }
                        }
                    }
                }
            },
            "SUV": {},
            "HÍBRIDOS Y ELÉCTRICOS": {}
        };

        let lastUnidad = "";
        let lastVersion = "";
        let lastTasa = "";
        let lastEnganche = "";
        let lastPrecio = "$750,000.00";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = parseCSVLine(line);
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

            // Categorización automática inteligente
            let tipo = "AUTOMÓVIL";
            if (lastUnidad.includes("SONET") || lastUnidad.includes("SELTOS") || lastUnidad.includes("SPORTAGE") || lastUnidad.includes("SORENTO") || lastUnidad.includes("TELLURIDE") || lastUnidad.includes("SUV")) {
                tipo = "SUV";
            } else if (lastUnidad.includes("NIRO") || lastUnidad.includes("EV3") || lastUnidad.includes("EV6") || lastUnidad.includes("EV9") || lastUnidad.includes("HEV")) {
                tipo = "HÍBRIDOS Y ELÉCTRICOS";
            }

            if (!data[tipo]) data[tipo] = {};
            if (!data[tipo][lastUnidad]) data[tipo][lastUnidad] = {};
            if (!data[tipo][lastUnidad][lastVersion]) {
                data[tipo][lastUnidad][lastVersion] = {
                    precio: lastPrecio,
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
                const parsed = parseCSV(text);
                if (Object.keys(parsed["AUTOMÓVIL"]).length > 1 || Object.keys(parsed["SUV"]).length > 0) {
                    vehiculosData = parsed;
                }
            }
        } catch (err) {
            console.error("Usando datos de respaldo locales por error de red", err);
        }
        
        // Si por algo falló la red, inicializa con estructura segura para que nunca quede en blanco
        if (!vehiculosData || Object.keys(vehiculosData["AUTOMÓVIL"]).length === 0) {
            vehiculosData = parseCSV(""); 
        }

        poblarSelectTipos();
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

        const info = vehiculosData[tipo]?.[unidad]?.[version];
        if (!info) {
            if (precioListaEl) precioListaEl.innerText = "$750,000.00";
            if (mesRows) mesRows.forEach(row => row.innerText = "$0.00");
            return;
        }

        if (precioListaEl) {
            precioListaEl.innerText = info.precio || "$750,000.00";
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

    if (selectTipo) selectTipo.addEventListener('change', cargarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', cargarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', cargarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarCalculos);

    cargarDatos();
});
