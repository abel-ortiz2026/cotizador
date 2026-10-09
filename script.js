document.addEventListener('DOMContentLoaded', () => {
    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0m35pW4q8hTL_fzHHxZcEpTif783qewXBSSsOUKKzBuHXOoBsdco_KOqP3PPPEWl8CD8yE5E01tsf/pub?gid=679410401&single=true&output=csv&t=' + new Date().getTime();

    const selectTipo = document.getElementById('select-tipo');
    const selectUnidad = document.getElementById('select-unidad');
    const selectVersion = document.getElementById('select-version');
    const selectEnganche = document.getElementById('select-enganche');
    const precioListaEl = document.getElementById('precio-lista');
    const tasaAnualEl = document.getElementById('tasa-anual');
    const mesVals = document.querySelectorAll('.mes-val');
    const btnPdf = document.getElementById('btn-pdf');

    const modalContacto = document.getElementById('modal-contacto');
    const btnAbrirModal = document.getElementById('btn-abrir-modal');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const btnEnviarWsp = document.getElementById('btn-enviar-wsp');
    const inputNombre = document.getElementById('input-nombre');
    const inputTelefono = document.getElementById('input-telefono');
    const resumenUnidad = document.getElementById('resumen-unidad');
    const resumenVersion = document.getElementById('resumen-version');
    const resumenEnganche = document.getElementById('resumen-enganche');
    const resumenMensualidad = document.getElementById('resumen-mensualidad');

    let vehiculosData = {};

    const clasificarVehiculo = (unidad) => {
        const u = (unidad || "").toUpperCase();
        if (u.includes("NIRO") || u.includes("EV3") || u.includes("EV6") || u.includes("EV9") || u.includes("HEV") || u.includes("HÍBRIDO") || u.includes("ELECTRICO") || u.includes("PHEV")) {
            return "HÍBRIDOS Y ELÉCTRICOS";
        }
        if (u.includes("SONET") || u.includes("SELTOS") || u.includes("SPORTAGE") || u.includes("SORENTO") || u.includes("TELLURIDE") || u.includes("SOUL") || u.includes("SUV")) {
            return "SUV";
        }
        return "AUTOMÓVIL";
    };

    const llenarTipos = () => {
        if (!selectTipo) return;
        selectTipo.innerHTML = '';
        const tiposDisponibles = Object.keys(vehiculosData).filter(t => Object.keys(vehiculosData[t]).length > 0);

        if (tiposDisponibles.length === 0) {
            selectTipo.innerHTML = '<option value="">Revisa la consola (F12)</option>';
            return;
        }

        tiposDisponibles.forEach(tipo => {
            const opt = document.createElement('option');
            opt.value = tipo;
            opt.textContent = tipo;
            selectTipo.appendChild(opt);
        });

        llenarUnidades();
    };

    const llenarUnidades = () => {
        if (!selectUnidad) return;
        const tipoSel = selectTipo.value;
        selectUnidad.innerHTML = '';
        const unidades = vehiculosData[tipoSel] ? Object.keys(vehiculosData[tipoSel]) : [];

        unidades.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u;
            opt.textContent = u;
            selectUnidad.appendChild(opt);
        });
        llenarVersiones();
    };

    const llenarVersiones = () => {
        if (!selectVersion) return;
        const tipoSel = selectTipo.value;
        const unidadSel = selectUnidad.value;
        selectVersion.innerHTML = '';

        const versiones = vehiculosData[tipoSel]?.[unidadSel] ? Object.keys(vehiculosData[tipoSel][unidadSel]) : [];

        versiones.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            selectVersion.appendChild(opt);
        });
        llenarEnganches();
    };

    const llenarEnganches = () => {
        if (!selectEnganche) return;
        const tipoSel = selectTipo.value;
        const unidadSel = selectUnidad.value;
        const versionSel = selectVersion.value;
        selectEnganche.innerHTML = '';

        const info = vehiculosData[tipoSel]?.[unidadSel]?.[versionSel];
        const enganches = (info && info.enganchesMap) ? Object.keys(info.enganchesMap) : [];

        enganches.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e;
            opt.textContent = e;
            selectEnganche.appendChild(opt);
        });
        actualizarPantalla();
    };

    const actualizarPantalla = () => {
        if (!selectTipo || !selectUnidad || !selectVersion || !selectEnganche) return;
        
        const tipo = selectTipo.value;
        const unidad = selectUnidad.value;
        const version = selectVersion.value;
        const enganche = selectEnganche.value;

        const info = vehiculosData[tipo]?.[unidad]?.[version];
        if (!info) return;

        if (precioListaEl) precioListaEl.innerText = info.precio || "$0.00";
        if (tasaAnualEl) tasaAnualEl.innerText = info.tasa || "12.99%";

        const plazosMap = info.enganchesMap?.[enganche] || {};
        const plazos = ["72", "60", "48", "36"];
        plazos.forEach((p, idx) => {
            if (mesVals[idx]) {
                mesVals[idx].innerText = plazosMap[p] || "$0.00";
            }
        });
    };

    Papa.parse(SHEET_CSV_URL, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
            const rows = results.data;
            console.log("Filas recibidas del CSV:", rows); // <-- Revisa esto en F12

            let data = {
                "AUTOMÓVIL": {},
                "SUV": {},
                "HÍBRIDOS Y ELÉCTRICOS": {}
            };

            let ultimaUnidad = "";
            let ultimaVersion = "";
            let ultimaTasa = "12.99%";
            let ultimoPrecio = "$700,000.00";

            rows.forEach((cols, index) => {
                if (!cols || cols.length === 0) return;

                // Buscamos dinámicamente texto en las columnas de la fila para no depender de un índice fijo
                let textoUnidad = "";
                let textoVersion = "";
                let textoEnganche = "";
                let textoPlazo = "";
                let textoMensualidad = "";
                let textoPrecio = "";

                cols.forEach(cell => {
                    const c = (cell || "").trim();
                    if (!c) return;
                    if (c.toUpperCase().includes("K3") || c.toUpperCase().includes("SELTOS") || c.toUpperCase().includes("SPORTAGE") || c.toUpperCase().includes("SORENTO") || c.toUpperCase().includes("NIRO") || c.toUpperCase().includes("RIO") || c.toUpperCase().includes("FORTE")) {
                        textoUnidad = c.toUpperCase();
                    }
                    if (c.toUpperCase().includes("TM") || c.toUpperCase().includes("TA") || c.toUpperCase().includes("EX") || c.toUpperCase().includes("LX") || c.toUpperCase().includes("GT")) {
                        textoVersion = c.toUpperCase();
                    }
                    if (c.includes("$") && c.length > 5 && !c.includes("%")) {
                        if (ultimoPrecio === "$700,000.00") textoPrecio = c;
                        else textoEnganche = c;
                    }
                    if (c.includes("%")) ultimaTasa = c;
                    if (c === "36" || c === "48" || c === "60" || c === "72") textoPlazo = c;
                });

                if (textoUnidad) ultimaUnidad = textoUnidad;
                if (textoVersion) ultimaVersion = textoVersion;
                if (textoPrecio && textoPrecio !== "$700,000.00") ultimoPrecio = textoPrecio;

                if (!ultimaUnidad || !ultimaVersion) return;

                const tipo = clasificarVehiculo(ultimaUnidad);
                if (!data[tipo][ultimaUnidad]) data[tipo][ultimaUnidad] = {};
                if (!data[tipo][ultimaUnidad][ultimaVersion]) {
                    data[tipo][ultimaUnidad][ultimaVersion] = {
                        precio: ultimoPrecio,
                        tasa: ultimaTasa,
                        enganchesMap: {}
                    };
                }
            });

            vehiculosData = data;
            llenarTipos();
        },
        error: (err) => {
            console.error("Error CSV:", err);
        }
    });

    if (selectTipo) selectTipo.addEventListener('change', llenarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', llenarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', llenarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarPantalla);
});
