document.addEventListener('DOMContentLoaded', () => {

    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0m35pW4q8hTL_fzHHxZcEpTif783qewXBSSsOUKKzBuHXOoBsdco_KOqP3PPPEWl8CD8yE5E01tsf/pub?gid=679410401&single=true&output=csv';

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
        const u = unidad.toUpperCase();
        if (u.includes("NIRO") || u.includes("EV3") || u.includes("EV6") || u.includes("EV9") || u.includes("HEV") || u.includes("HÍBRIDO") || u.includes("ELECTRICO") || u.includes("PHEV")) {
            return "HÍBRIDOS Y ELÉCTRICOS";
        }
        if (u.includes("SONET") || u.includes("SELTOS") || u.includes("SPORTAGE") || u.includes("SORENTO") || u.includes("TELLURIDE") || u.includes("SOUL") || u.includes("SUV")) {
            return "SUV";
        }
        return "AUTOMÓVIL";
    };

    const procesarCSV = (results) => {
        const rows = results.data;
        let data = {
            "AUTOMÓVIL": {},
            "SUV": {},
            "HÍBRIDOS Y ELÉCTRICOS": {}
        };

        let unidadActual = "";
        let versionActual = "";
        let precioPorDefecto = "\$0.00";
        let tasaPorDefecto = "12.99%";

        // Primera pasada: recolectar el precio real y la tasa real que SÍ aparecen en el CSV
        let mapaPrecios = {};
        let mapaTasas = {};

        rows.forEach((cols) => {
            if (!cols || cols.length < 8) return;

            const uVal = (cols[2] || "").trim();
            const vVal = (cols[3] || "").trim();
            const tVal = (cols[4] || "").trim();
            const pVal = (cols[8] || "").trim();

            if (uVal && !uVal.toUpperCase().includes("COTIZACION") && !uVal.toUpperCase().includes("UNIDAD")) {
                unidadActual = uVal.toUpperCase();
            }
            if (vVal && !vVal.toUpperCase().includes("VERSION")) {
                versionActual = vVal.toUpperCase();
            }

            if (!unidadActual || !versionActual) return;
            const clave = `${unidadActual}_${versionActual}`;

            if (pVal && !pVal.toUpperCase().includes("PRECIO") && pVal.length > 2 && pVal !== "\$0.00") {
                mapaPrecios[clave] = pVal;
            }
            if (tVal && !tVal.toUpperCase().includes("TASA") && tVal.includes("%")) {
                mapaTasas[clave] = tVal;
            }
        });

        // Segunda pasada: Construcción limpia de la data
        unidadActual = "";
        versionActual = "";
        let engancheActual = "";

        rows.forEach((cols) => {
            if (!cols || cols.length < 8) return;

            const unidadVal = (cols[2] || "").trim();
            const versionVal = (cols[3] || "").trim();
            const engancheVal = (cols[5] || "").trim();
            const plazoVal = (cols[6] || "").trim();
            const mensualidadVal = (cols[7] || "").trim();

            if (unidadVal && !unidadVal.toUpperCase().includes("COTIZACION") && !unidadVal.toUpperCase().includes("UNIDAD")) {
                unidadActual = unidadVal.toUpperCase();
            }
            if (versionVal && !versionVal.toUpperCase().includes("VERSION")) {
                versionActual = versionVal.toUpperCase();
            }
            if (engancheVal && !engancheVal.toUpperCase().includes("ENGANCHE")) {
                engancheActual = engancheVal;
            }

            if (!unidadActual || !versionActual || !engancheActual || !plazoVal || !mensualidadVal) return;

            const tipo = clasificarVehiculo(unidadActual);
            const clave = `${unidadActual}_${versionActual}`;

            const precioFinal = mapaPrecios[clave] || "\$0.00";
            const tasaFinal = mapaTasas[clave] || "12.99%";

            if (!data[tipo][unidadActual]) data[tipo][unidadActual] = {};
            if (!data[tipo][unidadActual][versionActual]) {
                data[tipo][unidadActual][versionActual] = {
                    precio: precioFinal,
                    tasa: tasaFinal,
                    enganchesMap: {}
                };
            }

            const engMap = data[tipo][unidadActual][versionActual].enganchesMap;
            if (!engMap[engancheActual]) {
                engMap[engancheActual] = {};
            }

            const plazoNum = plazoVal.replace(/[^0-9]/g, '');
            if (plazoNum) {
                engMap[engancheActual][plazoNum] = mensualidadVal;
            }
        });

        vehiculosData = data;
        llenarTipos();
    };

    const llenarTipos = () => {
        if (!selectTipo) return;
        selectTipo.innerHTML = '';
        
        const tiposDisponibles = Object.keys(vehiculosData).filter(t => Object.keys(vehiculosData[t]).length > 0);

        if (tiposDisponibles.length === 0) {
            selectTipo.innerHTML = '<option value="">No hay tipos disponibles</option>';
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

        if (unidades.length === 0) {
            selectUnidad.innerHTML = '<option value="">Sin unidades</option>';
        } else {
            unidades.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u;
                opt.textContent = u;
                selectUnidad.appendChild(opt);
            });
        }
        llenarVersiones();
    };

    const llenarVersiones = () => {
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
        actualizarPantalla();
    };

    const actualizarPantalla = () => {
        if (!selectTipo || !selectUnidad || !selectVersion || !selectEnganche) return;
        
        const tipo = selectTipo.value;
        const unidad = selectUnidad.value;
        const version = selectVersion.value;
        const enganche = selectEnganche.value;

        const info = vehiculosData[tipo]?.[unidad]?.[version];
        if (!info) {
            if (precioListaEl) precioListaEl.innerText = "\$0.00";
            if (tasaAnualEl) tasaAnualEl.innerText = "12.99%";
            if (mesVals) mesVals.forEach(r => r.innerText = "\$0.00");
            return;
        }

        if (precioListaEl) precioListaEl.innerText = info.precio || "\$0.00";
        if (tasaAnualEl) tasaAnualEl.innerText = info.tasa || "12.99%";

        const plazosMap = info.enganchesMap?.[enganche] || {};
        const plazos = ["72", "60", "48", "36"];
        plazos.forEach((p, idx) => {
            if (mesVals[idx]) {
                mesVals[idx].innerText = plazosMap[p] || "\$0.00";
            }
        });
    };

    if (selectTipo) selectTipo.addEventListener('change', llenarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', llenarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', llenarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarPantalla);

    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', () => {
            if (resumenUnidad) resumenUnidad.textContent = `Unidad: ${selectUnidad.value || '-'}`;
            if (resumenVersion) resumenVersion.textContent = `Versión: ${selectVersion.value || '-'}`;
            if (resumenEnganche) resumenEnganche.textContent = `Enganche: ${selectEnganche.value || '-'}`;
            if (resumenMensualidad && mesVals[2]) resumenMensualidad.textContent = `Mensualidad (48m): ${mesVals[2].textContent}`;
            if (modalContacto) modalContacto.style.display = 'flex';
        });
    }

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', () => {
            if (modalContacto) modalContacto.style.display = 'none';
        });
    }

    if (btnEnviarWsp) {
        btnEnviarWsp.addEventListener('click', () => {
            const nombre = inputNombre ? inputNombre.value.trim() : '';
            const telefono = inputTelefono ? inputTelefono.value.trim() : '';
            const unidad = selectUnidad.value || '-';
            const version = selectVersion.value || '-';
            const precio = precioListaEl ? precioListaEl.textContent : '-';
            const enganche = selectEnganche.value || '-';
            const mes48 = mesVals[2] ? mesVals[2].textContent : '-';

            const mensaje = `Hola, mi nombre es *${nombre || 'Cliente'}* (Tel: ${telefono || 'No proporcionado'}). Me interesa la siguiente cotización:\n\n🚗 *Vehículo:* ${unidad} - ${version}\n💰 *Precio:* ${precio}\n📥 *Enganche:* ${enganche}\n📅 *Mensualidad (48 meses):* ${mes48}`;
            
            window.open(`https://wa.me/528448067192?text=${encodeURIComponent(mensaje)}`, '_blank');
        });
    }

    if (btnPdf) {
        btnPdf.addEventListener('click', () => {
            const elemento = document.querySelector('.cotizador-card');
            const opciones = {
                margin: 1,
                filename: 'Cotizacion-KIA-Saltillo.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().from(elemento).set(opciones).save();
        });
    }

    Papa.parse(SHEET_CSV_URL, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
            procesarCSV(results);
        },
        error: (err) => {
            console.error("Error al descargar el CSV:", err);
        }
    });
});
