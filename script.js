document.addEventListener('DOMContentLoaded', () => {

    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0m35pW4q8hTL_fzHHxZcEpTif783qewXBSSsOUKKzBuHXOoBsdco_KOqP3PPPEWl8CD8yE5E01tsf/pub?gid=679410401&single=true&output=csv';

    const selectTipo = document.getElementById('select-tipo');
    const selectUnidad = document.getElementById('select-unidad');
    const selectVersion = document.getElementById('select-version');
    const selectEnganche = document.getElementById('select-enganche');
    const precioListaEl = document.getElementById('precio-lista');
    const mesRows = document.querySelectorAll('.mes-row strong');

    let vehiculosData = {};

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

    const procesarDatosCSV = (results) => {
        const rows = results.data;
        let data = {
            "AUTOMÓVIL": {},
            "SUV": {},
            "HÍBRIDOS Y ELÉCTRICOS": {}
        };

        let lastUnidad = "";
        let lastVersion = "";
        let lastTasa = "12.99%";
        let lastEnganche = "";
        let lastPrecio = "$0.00";

        rows.forEach(cols => {
            if (!cols || cols.length < 8) return;

            const unidadVal = (cols[2] || "").trim();
            const versionVal = (cols[3] || "").trim();
            const tasaVal = (cols[4] || "").trim();
            const engancheVal = (cols[5] || "").trim();
            const plazoVal = (cols[6] || "").trim();
            const mensualidadVal = (cols[7] || "").trim();
            const precioVal = (cols[8] || "").trim();

            if (unidadVal && !unidadVal.toUpperCase().includes("COTIZACION") && !unidadVal.toUpperCase().includes("UNIDAD")) {
                lastUnidad = unidadVal.toUpperCase();
            }
            if (versionVal && !versionVal.toUpperCase().includes("VERSION")) {
                lastVersion = versionVal.toUpperCase();
            }
            if (tasaVal && !tasaVal.toUpperCase().includes("TASA")) {
                lastTasa = tasaVal;
            }
            if (engancheVal && !engancheVal.toUpperCase().includes("ENGANCHE")) {
                lastEnganche = engancheVal;
            }
            if (precioVal && !precioVal.toUpperCase().includes("PRECIO") && precioVal.length > 2) {
                lastPrecio = precioVal;
            }

            if (!lastUnidad || !lastVersion || !lastEnganche || !plazoVal || !mensualidadVal) return;

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

            if (lastPrecio && lastPrecio !== "$0.00") {
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
        });

        vehiculosData = data;
        poblarSelectTipos();
    };

    const cargarDatosDesdeSheet = () => {
        Papa.parse(SHEET_CSV_URL, {
            download: true,
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
                procesarDatosCSV(results);
            },
            error: (err) => {
                console.error("Error al leer el CSV con PapaParse:", err);
            }
        });
    };

    const poblarSelectTipos = () => {
        if (!selectTipo) return;
        selectTipo.innerHTML = '';
        const categorias = Object.keys(vehiculosData).filter(cat => Object.keys(vehiculosData[cat]).length > 0);

        if (categorias.length === 0) {
            selectTipo.innerHTML = '<option value="">No hay categorías</option>';
            return;
        }

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
        const tipoSel = selectTipo.value;
        selectUnidad.innerHTML = '';
        const unidades = vehiculosData[tipoSel] ? Object.keys(vehiculosData[tipoSel]) : [];

        if (unidades.length === 0) {
            selectUnidad.innerHTML = '<option value="">No hay unidades disponibles</option>';
        } else {
            unidades.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u;
                opt.textContent = u;
                selectUnidad.appendChild(opt);
            });
        }
        cargarVersiones();
    };

    const cargarVersiones = () => {
        if (!selectVersion) return;
        const tipoSel = selectTipo.value;
        const unidadSel = selectUnidad.value;
        selectVersion.innerHTML = '';
        const versiones = vehiculosData[tipoSel]?.[unidadSel] ? Object.keys(vehiculosData[tipoSel][unidadSel]) : [];

        if (versiones.length === 0) {
            selectVersion.innerHTML = '<option value="">Sin versiones</option>';
        } else {
            versiones.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = v;
                selectVersion.appendChild(opt);
            });
        }
        cargarEnganches();
    };

    const cargarEnganches = () => {
        if (!selectEnganche) return;
        const tipoSel = selectTipo.value;
        const unidadSel = selectUnidad.value;
        const versionSel = selectVersion.value;
        selectEnganche.innerHTML = '';

        const info = vehiculosData[tipoSel]?.[unidadSel]?.[versionSel];
        const enganches = (info && info.enganchesMap) ? Object.keys(info.enganchesMap) : [];

        if (enganches.length === 0) {
            selectEnganche.innerHTML = '<option value="">Sin enganches</option>';
        } else {
            enganches.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e;
                opt.textContent = e;
                selectEnganche.appendChild(opt);
            });
        }
        actualizarCalculos();
    };

    const actualizarCalculos = () => {
        if (!selectTipo || !selectUnidad || !selectVersion || !selectEnganche) return;
        const tipoSel = selectTipo.value;
        const unidadSel = selectUnidad.value;
        const versionSel = selectVersion.value;
        const engancheSel = selectEnganche.value;

        const info = vehiculosData[tipoSel]?.[unidadSel]?.[versionSel];
        if (!info) {
            if (precioListaEl) precioListaEl.innerText = "$0.00";
            if (mesRows) mesRows.forEach(r => r.innerText = "$0.00");
            return;
        }

        if (precioListaEl) {
            precioListaEl.innerText = info.precio || "$0.00";
        }

        const plazosMap = info.enganchesMap?.[engancheSel] || {};
        const plazos = ["72", "60", "48", "36"];
        plazos.forEach((p, idx) => {
            if (mesRows[idx]) {
                mesRows[idx].innerText = plazosMap[p] || "$0.00";
            }
        });
    };

    if (selectTipo) selectTipo.addEventListener('change', cargarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', cargarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', cargarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarCalculos);

    cargarDatosDesdeSheet();
});
