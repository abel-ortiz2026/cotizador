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
            selectTipo.innerHTML = '<option value="">Sin datos detectados</option>';
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

    Papa.parse(SHEET_CSV_URL, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
            const rows = results.data;
            let data = {
                "AUTOMÓVIL": {},
                "SUV": {},
                "HÍBRIDOS Y ELÉCTRICOS": {}
            };

            let ultimaUnidad = "";
            let ultimaVersion = "";
            let ultimaTasa = "12.99%";
            let ultimoPrecio = "\$750,000.00";
            let ultimoEnganche = "";

            rows.forEach((cols) => {
                if (!cols || cols.length === 0) return;

                // Buscamos dinámicamente en los valores de la fila
                cols.forEach(cell => {
                    const val = (cell || "").trim();
                    if (!val) return;

                    const upper = val.toUpperCase();
                    // Detectar vehículos comunes
                    if (upper.includes("K3") || upper.includes("SELTOS") || upper.includes("SPORTAGE") || upper.includes("SORENTO") || upper.includes("NIRO") || upper.includes("RIO") || upper.includes("FORTE") || upper.includes("SONET")) {
                        if (!upper.includes("COTIZACION") && !upper.includes("COTIZACIÓN")) {
                            ultimaUnidad = upper;
                        }
                    }
                    // Detectar versiones comunes
                    if (upper === "L TM" || upper === "LX TM" || upper === "EX" || upper === "GT" || upper.includes("TM") || upper.includes("TA")) {
                        if (upper.length < 15) ultimaVersion = upper;
                    }
                    // Detectar tasa
                    if (val.includes("%")) {
                        ultimaTasa = val;
                    }
                    // Detectar montos en dinero
                    if (val.includes("\$") && val.length > 5) {
                        if (val.includes(",")) {
                            // Si es precio alto o enganche
                            if (val.replace(/[^0-9]/g, '') > 300000) {
                                ultimoPrecio = val;
                            } else {
                                ultimoEnganche = val;
                            }
                        }
                    }
                });

                // Si detectamos plazo y mensualidad por posición estándar de respaldo
                let plazoStr = "";
                let mensStr = "";
                for (let i = 0; i < cols.length; i++) {
                    const c = (cols[i] || "").trim();
                    if (c === "36" || c === "48" || c === "60" || c === "72") {
                        plazoStr = c;
                        mensStr = (cols[i+1] || "").trim();
                    }
                }

                if (!ultimaUnidad || !ultimaVersion || !ultimoEnganche || !plazoStr || !mensStr) return;

                const tipo = clasificarVehiculo(ultimaUnidad);
                if (!data[tipo][ultimaUnidad]) data[tipo][ultimaUnidad] = {};
                if (!data[tipo][ultimaUnidad][ultimaVersion]) {
                    data[tipo][ultimaUnidad][ultimaVersion] = {
                        precio: ultimoPrecio,
                        tasa: ultimaTasa,
                        enganchesMap: {}
                    };
                }

                const engMap = data[tipo][ultimaUnidad][ultimaVersion].enganchesMap;
                if (!engMap[ultimoEnganche]) engMap[ultimoEnganche] = {};

                engMap[ultimoEnganche][plazoStr] = mensStr;
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
});
