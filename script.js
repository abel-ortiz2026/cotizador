document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // URL DE TU HOJA GOOGLE SHEETS PUBLICADA EN CSV
    // =========================================================================
    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTeciveu_jyLNV4RZrGhyJNzbiWUMNLz3paNSxhB3NncLq2YLLzl3eCbW5wPC27gA/pub?gid=679410401&single=true&output=csv';

    // Elementos DOM
    const selectTipo = document.getElementById('select-tipo');
    const selectUnidad = document.getElementById('select-unidad');
    const selectVersion = document.getElementById('select-version');
    const selectEnganche = document.getElementById('select-enganche');
    const precioListaEl = document.getElementById('precio-lista');
    const mesRows = document.querySelectorAll('.mes-row strong');

    // Botones e Interfaz
    const btnContact = document.getElementById('btn-contact');
    const modal = document.getElementById('contact-modal');
    const btnClose = document.getElementById('close-modal');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnEmail = document.getElementById('btn-email');
    const btnPdfModal = document.getElementById('btn-pdf-modal');
    const btnPdfMain = document.getElementById('btn-pdf-main');

    // Se inicia VACÍO para depender 100% de la hoja de Google Sheets
    let vehiculosData = {};

    const formatearMoneda = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto || 0);

    const calcularMensualidad = (montoFinanciar, plazoMeses, tasaAnual = 0.1299) => {
        if (!montoFinanciar || montoFinanciar <= 0) return 0;
        const tasaMensual = tasaAnual / 12;
        return (montoFinanciar * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazoMeses));
    };

    // =========================================================================
    // PARSER CSV DE GOOGLE SHEETS (Ajustado a la estructura de tu hoja)
    // =========================================================================
    const parseCSV = (csvText) => {
        const lines = csvText.split(/\r\n|\n/);
        const data = {};

        let currentUnidad = "";
        let currentVersion = "";
        let currentPrecio = 0;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"\vert{}"$/g, ''));

            // Según tu captura de Google Sheets:
            // Col C = cols[2] -> Unidad (K3 SEDAN)
            // Col D = cols[3] -> Version (L TM)
            // Col F = cols[5] -> Enganche ($63,511.95)
            // Col I = cols[8] -> Precio ($310,100.00)
            
            const unidadVal = cols[2] ? cols[2].toUpperCase() : "";
            const versionVal = cols[3] ? cols[3].toUpperCase() : "";
            const engancheVal = cols[5] ? parseFloat(cols[5].replace(/[^0-9.-]+/g, '')) : 0;
            const precioVal = cols[8] ? parseFloat(cols[8].replace(/[^0-9.-]+/g, '')) : 0;

            if (unidadVal) currentUnidad = unidadVal;
            if (versionVal) currentVersion = versionVal;
            if (precioVal > 0) currentPrecio = precioVal;

            if (!currentUnidad || !currentVersion || currentPrecio === 0 || engancheVal === 0) continue;

            let tipo = "AUTOMÓVIL";
            if (["SONET", "SELTOS", "SPORTAGE", "SORENTO", "TELLURIDE"].includes(currentUnidad)) {
                tipo = "SUV";
            } else if (["NIRO", "SELTOS HIBRIDA", "SPORTAGE HEV", "EV3 ELECTRICO", "EV3", "EV6"].includes(currentUnidad)) {
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

        return data;
    };

    const cargarDatos = async () => {
        try {
            const response = await fetch(SHEET_CSV_URL);
            if (response.ok) {
                const text = await response.text();
                const parsed = parseCSV(text);
                if (parsed && Object.keys(parsed).length > 0) {
                    vehiculosData = parsed;
                    poblarSelectTipos();
                }
            }
        } catch (err) {
            console.error("Error cargando Google Sheets. Recuerda probar esto bajo un servidor local (HTTP) o GitHub Pages:", err);
        }
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

        if (vehiculosData[tipoSeleccionado] && Object.keys(vehiculosData[tipoSeleccionado]).length > 0) {
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

    // Eventos
    if (selectTipo) selectTipo.addEventListener('change', cargarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', cargarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', cargarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarCalculos);

    // Impresión / PDF
    const ImprimirCotizacion = () => {
        const pdfDateEl = document.getElementById('pdf-date');
        if (pdfDateEl) {
            pdfDateEl.innerText = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        }

        if (modal) modal.classList.remove('active');

        const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (esMovil && typeof html2pdf !== 'undefined') {
            const elementoPDF = document.getElementById('pdf-template-container');
            const unidad = selectUnidad ? selectUnidad.value : 'Cotizacion';
            const version = selectVersion ? selectVersion.value : 'KIA';

            const opciones = {
                margin:       10,
                filename:     `Cotizacion_KIA_${unidad}_${version}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
            };

            elementoPDF.style.display = 'block';

            html2pdf().set(opciones).from(elementoPDF).save().then(() => {
                elementoPDF.style.display = '';
            });
        } else {
            window.print();
        }
    };

    if (btnPdfMain) btnPdfMain.addEventListener('click', ImprimirCotizacion);
    if (btnPdfModal) btnPdfModal.addEventListener('click', ImprimirCotizacion);

    // Modal y contacto
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
            if (e.target === modal) modal.classList.remove('active');
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

    // Iniciar lectura directa de Google Sheets
    cargarDatos();
});