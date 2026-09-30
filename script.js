document.addEventListener('DOMContentLoaded', () => {

    // URL del Google Sheet CSV
    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQm8TjsEN4AnRugDL5CjL0-KLcRQiAyTvkSuzofhZz8hEuReFhZG_IAVNYOMojcrQ/pub?gid=679410401&single=true&output=csv';

    // Elementos DOM principales
    const selectTipo = document.getElementById('select-tipo');
    const selectUnidad = document.getElementById('select-unidad');
    const selectVersion = document.getElementById('select-version');
    const selectEnganche = document.getElementById('select-enganche');
    const precioListaEl = document.getElementById('precio-lista');
    const mesRows = document.querySelectorAll('.mes-row strong');

    // Modal
    const btnContact = document.getElementById('btn-contact');
    const modal = document.getElementById('contact-modal');
    const btnClose = document.getElementById('close-modal');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnEmail = document.getElementById('btn-email');
    const btnPdfModal = document.getElementById('btn-pdf-modal');
    const btnPdfMain = document.getElementById('btn-pdf-main');

    // Base de datos completa integrada (Respaldo garantizado)
    let vehiculosData = {
        "AUTOMÓVIL": {
            "K3 SEDAN": {
                "L TM": { precio: 304900, enganches: [68491.66, 82516.60, 111955.85] },
                "LX TM": { precio: 358600, enganches: [60457.12, 74439.60, 110323.00] },
                "L TA": { precio: 335500, enganches: [55322.20, 70006.90, 102491.00] },
                "LX TA": { precio: 372600, enganches: [63626.80, 79111.60, 111956.00] },
                "EX TA": { precio: 400300, enganches: [69827.80, 85909.50, 124585.00] },
                "EXPACK": { precio: 435900, enganches: [77796.10, 94464.10, 136762.00] }
            },
            "K4 SEDAN": {
                "LX TM": { precio: 431500, enganches: [113519.00, 155209.00, 196900.00] },
                "LX TA": { precio: 445500, enganches: [116953.00, 159996.00, 203039.00] },
                "EX TA": { precio: 489400, enganches: [127722.00, 175006.00, 222291.00] },
                "GT LINE": { precio: 526700, enganches: [136872.00, 187760.00, 238212.00] },
                "GT LINE TURBO": { precio: 576600, enganches: [149113.00, 204822.00, 250498.00] }
            }
        },
        "SUV": {
            "SONET": {
                "LX TM": { precio: 398400, enganches: [86356.20, 124848.00, 183341.00] },
                "LX TA": { precio: 411900, enganches: [89700.10, 129497.00, 169293.00] },
                "EX TA": { precio: 433000, enganches: [94926.70, 136762.00, 178597.00] },
                "SX TA": { precio: 475900, enganches: [105553.00, 151553.00, 197514.00] }
            },
            "SELTOS": {
                "LX TA": { precio: 499900, enganches: [131500.00, 179989.00, 234629.00] },
                "EX TA": { precio: 529900, enganches: [139063.00, 190270.00, 241477.00] },
                "EXPACK TA": { precio: 554900, enganches: [145216.00, 199321.00, 252461.00] },
                "SX TA": { precio: 619900, enganches: [161213.00, 220120.00, 280013.00] }
            },
            "SPORTAGE": {
                "EX TA": { precio: 647900, enganches: [117291.00, 179889.00, 242487.00] },
                "EXPACK TA": { precio: 706900, enganches: [131826.00, 200125.00, 268423.00] },
                "SXL TA": { precio: 766900, enganches: [146608.00, 220703.00, 294799.00] }
            }
        },
        "HÍBRIDOS Y ELÉCTRICOS": {
            "SPORTAGE HEV": {
                "EXPACK": { precio: 799900, enganches: [154738.00, 282022.00, 309306.00] },
                "X LINE": { precio: 893200, enganches: [177724.00, 264022.00, 350320.00] }
            },
            "EV3 ELECTRICO": {
                "EX": { precio: 689700, enganches: [186645.00, 253282.00, 319919.00] },
                "SXL": { precio: 767400, enganches: [207156.00, 280952.00, 355096.00] }
            }
        }
    };

    const formatearMoneda = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

    const calcularMensualidad = (montoFinanciar, plazoMeses, tasaAnual = 0.1299) => {
        const tasaMensual = tasaAnual / 12;
        return (montoFinanciar * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazoMeses));
    };

    // Parser CSV seguro con acumulación de campos nulos
    const parseCSV = (csvText) => {
        const lines = csvText.split(/\r\n|\n/);
        const data = {};

        let currentUnidad = "";
        let currentVersion = "";
        let currentPrecio = 0;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"\vert{}"$/g, ''));
            if (cols.length < 7) continue;

            const unidadVal = cols[0] ? cols[0].toUpperCase() : "";
            const versionVal = cols[1] ? cols[1].toUpperCase() : "";
            const engancheVal = cols[3] ? parseFloat(cols[3].replace(/[^0-9.-]+/g, '')) : 0;
            const precioVal = cols[6] ? parseFloat(cols[6].replace(/[^0-9.-]+/g, '')) : 0;

            if (unidadVal) currentUnidad = unidadVal;
            if (versionVal) currentVersion = versionVal;
            if (precioVal > 0) currentPrecio = precioVal;

            if (!currentUnidad || !currentVersion || currentPrecio === 0 || engancheVal === 0) continue;

            let tipo = "AUTOMÓVIL";
            if (["SONET", "SELTOS", "SPORTAGE", "SORENTO", "TELLURIDE"].includes(currentUnidad)) {
                tipo = "SUV";
            } else if (["NIRO", "SELTOS HIBRIDA", "SPORTAGE HEV", "EV3 ELECTRICO", "EV3"].includes(currentUnidad)) {
                tipo = "HÍBRIDOS Y ELÉCTRICOS";
            }

            if (!data[tipo]) data[tipo] = {};
            if (!data[tipo][currentUnidad]) data[tipo][currentUnidad] = {};
            if (!data[tipo][currentUnidad][currentVersion]) {
                data[tipo][currentUnidad][currentVersion] = {
                    precio: currentPrecio,
                    enganches: []
                };
            }

            if (!data[tipo][currentUnidad][currentVersion].enganches.includes(engancheVal)) {
                data[tipo][currentUnidad][currentVersion].enganches.push(engancheVal);
            }
        }

        return Object.keys(data).length > 0 ? data : null;
    };

    const cargarDatos = async () => {
        try {
            const response = await fetch(SHEET_CSV_URL);
            if (response.ok) {
                const text = await response.text();
                const parsed = parseCSV(text);
                if (parsed) {
                    vehiculosData = parsed;
                    console.log("✅ Datos sincronizados desde Google Sheets.");
                }
            }
        } catch (err) {
            console.warn("⚠️ Ejecutando en modo offline/local con base integrada:", err);
        }

        // Se ejecuta siempre, sin importar si falló la red
        poblarSelectTipos();
    };

    const actualizarResumenModal = (unidad, version, enganche, mensualidad48) => {
        const sumUnidad = document.getElementById('summary-unidad');
        const sumVersion = document.getElementById('summary-version');
        const sumEnganche = document.getElementById('summary-enganche');
        const sumMensualidad = document.getElementById('summary-mensualidad');

        if (sumUnidad) sumUnidad.innerText = unidad;
        if (sumVersion) sumVersion.innerText = version;
        if (sumEnganche) sumEnganche.innerText = formatearMoneda(enganche);
        if (sumMensualidad) sumMensualidad.innerText = formatearMoneda(mensualidad48);
    };

    const actualizarCalculos = () => {
        if (!selectTipo || !selectUnidad || !selectVersion || !selectEnganche) return;

        const tipo = selectTipo.value;
        const unidad = selectUnidad.value;
        const version = selectVersion.value;

        if (!vehiculosData[tipo] || !vehiculosData[tipo][unidad] || !vehiculosData[tipo][unidad][version]) return;

        const info = vehiculosData[tipo][unidad][version];
        const precio = info.precio;

        if (precioListaEl) precioListaEl.innerText = formatearMoneda(precio);

        const engancheVal = parseFloat(selectEnganche.value) || (info.enganches ? info.enganches[0] : 0);
        const montoFinanciar = precio - engancheVal;

        const plazos = [72, 60, 48, 36];
        let mensualidad48 = 0;

        plazos.forEach((plazo, index) => {
            const pago = calcularMensualidad(montoFinanciar, plazo);
            if (plazo === 48) mensualidad48 = pago;
            if (mesRows[index]) {
                mesRows[index].innerText = formatearMoneda(pago);
            }
        });

        actualizarResumenModal(unidad, version, engancheVal, mensualidad48);
        actualizarPlantillaPDF(unidad, version, precio, engancheVal, montoFinanciar);
    };

    const actualizarPlantillaPDF = (unidad, version, precio, enganche, montoFinanciar) => {
        const pdfTable = document.querySelector('#pdf-template-container .pdf-table');
        if (pdfTable) {
            const tds = pdfTable.querySelectorAll('td.fw-bold');
            if (tds.length >= 4) {
                tds[0].innerText = unidad;
                tds[1].innerText = version;
                tds[2].innerText = formatearMoneda(precio);
                tds[3].innerText = formatearMoneda(enganche);
            }
        }

        const pdfMesTds = document.querySelectorAll('#pdf-template-container .pdf-table-mensualidades td.fw-bold');
        const plazos = [72, 60, 48, 36];

        plazos.forEach((plazo, index) => {
            if (pdfMesTds[index]) {
                const pago = calcularMensualidad(montoFinanciar, plazo);
                pdfMesTds[index].innerText = formatearMoneda(pago);
            }
        });
    };

    const poblarSelectTipos = () => {
        if (!selectTipo) return;
        selectTipo.innerHTML = '';
        Object.keys(vehiculosData).forEach(tipo => {
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
            Object.keys(vehiculosData[tipoSeleccionado]).forEach(unidad => {
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

        if (vehiculosData[tipoSeleccionado] && vehiculosData[tipoSeleccionado][unidadSeleccionada]) {
            Object.keys(vehiculosData[tipoSeleccionado][unidadSeleccionada]).forEach(version => {
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
        if (info && info.enganches) {
            info.enganches.forEach(monto => {
                const opt = document.createElement('option');
                opt.value = monto;
                opt.textContent = formatearMoneda(monto);
                selectEnganche.appendChild(opt);
            });
        }

        actualizarCalculos();
    };

    if (selectTipo) selectTipo.addEventListener('change', cargarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', cargarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', cargarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarCalculos);

    const ImprimirCotizacion = () => {
        const pdfDateEl = document.getElementById('pdf-date');
        if (pdfDateEl) {
            pdfDateEl.innerText = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        if (modal) modal.classList.remove('active');
        window.print();
    };

    if (btnPdfMain) btnPdfMain.addEventListener('click', ImprimirCotizacion);
    if (btnPdfModal) btnPdfModal.addEventListener('click', ImprimirCotizacion);

    if (btnContact && modal) {
        btnContact.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
        });
    }

    if (btnClose && modal) {
        btnClose.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    const getMensajeContacto = () => {
        const inputNombre = document.getElementById('user-name');
        const inputPhone = document.getElementById('user-phone');

        const nombre = (inputNombre && inputNombre.value.trim() !== '') ? inputNombre.value.trim() : 'Cliente';
        const telefono = (inputPhone && inputPhone.value.trim() !== '') ? inputPhone.value.trim() : 'No proporcionado';

        const unidad = selectUnidad ? selectUnidad.value : '';
        const version = selectVersion ? selectVersion.value : '';
        const engancheTxt = document.getElementById('summary-enganche')?.innerText || '$0.00';
        const mensualidadTxt = document.getElementById('summary-mensualidad')?.innerText || '$0.00';

        const mensaje = `Hola Abel, mi nombre es ${nombre} (Tel: ${telefono}).
Estoy interesado en la cotización del KIA ${unidad} (${version}).
- Enganche: ${engancheTxt}
- Mensualidad (48m): ${mensualidadTxt}`;

        return encodeURIComponent(mensaje);
    };

    if (btnWhatsapp) {
        btnWhatsapp.addEventListener('click', () => {
            const telefonoAsesor = '528448067192';
            window.open(`https://wa.me/${telefonoAsesor}?text=${getMensajeContacto()}`, '_blank');
        });
    }

    if (btnEmail) {
        btnEmail.addEventListener('click', () => {
            const correoAsesor = 'abel.ortiz@kiamax.com';
            const asunto = encodeURIComponent('Cotización de vehículo KIA');
            window.location.href = `mailto:${correoAsesor}?subject=${asunto}&body=${getMensajeContacto()}`;
        });
    }

    // Inicializar de forma segura
    cargarDatos();
});