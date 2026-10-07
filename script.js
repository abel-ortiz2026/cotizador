document.addEventListener('DOMContentLoaded', () => {

    // URL de la pestaña COTIZACIONES publicada en formato CSV
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

    let vehiculosData = {};

    const cleanText = (str) => {
        if (!str) return "";
        return str.toString().replace(/^["'\s]+|["'\s]+$/g, '').trim();
    };

    // Mapeo exhaustivo de unidades a su TIPO según la pestaña COTIZACIONES
    const obtenerTipoPorUnidad = (unidad) => {
        const u = unidad.toUpperCase();

        // Híbridos y Eléctricos
        if (
            u.includes("EV3") || 
            u.includes("EV6") || 
            u.includes("EV9") || 
            u.includes("NIRO") || 
            u.includes("HEV") || 
            u.includes("HIBRID") || 
            u.includes("ELECTRICO")
        ) {
            return "HÍBRIDOS Y ELÉCTRICOS";
        }

        // SUVs
        if (
            u.includes("SONET") || 
            u.includes("SELTOS") || 
            u.includes("SPORTAGE") || 
            u.includes("SORENTO") || 
            u.includes("TELLURIDE") || 
            u.includes("SOUL")
        ) {
            return "SUV";
        }

        // Automóviles (K3, K4, K5, Forte, Rio, etc.)
        return "AUTOMÓVIL";
    };

    const parseCSV = (csvText) => {
        const lines = csvText.split(/\r\n|\n/);
        const data = {};

        let idxUnidad = 2;
        let idxVersion = 3;
        let idxEnganche = 5;
        let idxPlazo = 6;
        let idxMensualidad = 7;
        let idxPrecio = 8;

        let currentUnidad = "";
        let currentVersion = "";
        let currentPrecio = "";
        let currentEnganche = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => cleanText(c));

            const lineUpper = line.toUpperCase();
            if (lineUpper.includes("COTIZACIONES") && lineUpper.includes("MENSUALIDAD")) {
                cols.forEach((colHeader, idx) => {
                    const h = colHeader.toUpperCase();
                    if (h.includes("COTIZACION") || h.includes("UNIDAD")) idxUnidad = idx;
                    if (h.includes("VERSION")) idxVersion = idx;
                    if (h.includes("ENGANCHE")) idxEnganche = idx;
                    if (h.includes("PLAZO")) idxPlazo = idx;
                    if (h.includes("MENSUALIDAD")) idxMensualidad = idx;
                    if (h.includes("PRECIO")) idxPrecio = idx;
                });
                continue;
            }

            const unidadVal = cols[idxUnidad] ? cols[idxUnidad].toUpperCase() : "";
            const versionVal = cols[idxVersion] ? cols[idxVersion].toUpperCase() : "";
            const precioRaw = cols[idxPrecio] || "";
            const engancheRaw = cols[idxEnganche] || "";
            const plazoRaw = cols[idxPlazo] || "";
            const mensualidadRaw = cols[idxMensualidad] || "";

            // Recordar valores para celdas combinadas en Excel
            if (unidadVal && !unidadVal.includes("COTIZACION")) currentUnidad = unidadVal;
            if (versionVal && !versionVal.includes("VERSION")) currentVersion = versionVal;
            if (precioRaw !== "") currentPrecio = precioRaw;
            if (engancheRaw !== "") currentEnganche = engancheRaw;

            if (!currentUnidad || !currentVersion || !currentEnganche || !plazoRaw || !mensualidadRaw) {
                continue;
            }

            const tipo = obtenerTipoPorUnidad(currentUnidad);

            if (!data[tipo]) data[tipo] = {};
            if (!data[tipo][currentUnidad]) data[tipo][currentUnidad] = {};
            if (!data[tipo][currentUnidad][currentVersion]) {
                data[tipo][currentUnidad][currentVersion] = {
                    precio: currentPrecio,
                    enganchesMap: {}
                };
            }

            if (currentPrecio) {
                data[tipo][currentUnidad][currentVersion].precio = currentPrecio;
            }

            const engMap = data[tipo][currentUnidad][currentVersion].enganchesMap;
            if (!engMap[currentEnganche]) {
                engMap[currentEnganche] = {};
            }

            const plazoNum = plazoRaw.replace(/[^0-9]/g, '');
            engMap[currentEnganche][plazoNum] = mensualidadRaw;
        }

        return data;
    };

    const cargarDatos = async () => {
        try {
            const urlAntiCache = `${SHEET_CSV_URL}&_v=${Date.now()}`;
            const response = await fetch(urlAntiCache);
            if (response.ok) {
                const text = await response.text();
                const parsed = parseCSV(text);
                if (parsed && Object.keys(parsed).length > 0) {
                    vehiculosData = parsed;
                    poblarSelectTipos();
                }
            }
        } catch (err) {
            console.error("Error al cargar datos de Google Sheets:", err);
        }
    };

    const poblarSelectTipos = () => {
        if (!selectTipo) return;
        selectTipo.innerHTML = '';

        const ordenDeseado = ["AUTOMÓVIL", "SUV", "HÍBRIDOS Y ELÉCTRICOS"];
        const tiposDisponibles = Object.keys(vehiculosData);

        const tiposOrdenados = [
            ...ordenDeseado.filter(t => tiposDisponibles.includes(t)),
            ...tiposDisponibles.filter(t => !ordenDeseado.includes(t))
        ];

        tiposOrdenados.forEach(tipo => {
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

        if (vehiculosData[tipoSeleccionado]?.[unidadSeleccionada]) {
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
        if (info && info.enganchesMap) {
            Object.keys(info.enganchesMap).forEach(montoEnganche => {
                const opt = document.createElement('option');
                opt.value = montoEnganche;
                opt.textContent = montoEnganche;
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
        if (sumEnganche) sumEnganche.innerText = enganche;
        if (sumMensualidad) sumMensualidad.innerText = mensualidad48;
    };

    const actualizarCalculos = () => {
        if (!selectTipo || !selectUnidad || !selectVersion || !selectEnganche) return;

        const tipo = selectTipo.value;
        const unidad = selectUnidad.value;
        const version = selectVersion.value;
        const engancheKey = selectEnganche.value;

        if (!vehiculosData[tipo]?.[unidad]?.[version]) return;

        const info = vehiculosData[tipo][unidad][version];
        
        if (precioListaEl) precioListaEl.innerText = info.precio || "$0.00";

        const plazosMap = info.enganchesMap?.[engancheKey] || {};
        const plazos = ["72", "60", "48", "36"];
        let mensualidad48 = "$0.00";

        plazos.forEach((plazoKey, index) => {
            const valorMensualidad = plazosMap[plazoKey] || "$0.00";
            if (plazoKey === "48") mensualidad48 = valorMensualidad;
            if (mesRows[index]) {
                mesRows[index].innerText = valorMensualidad;
            }
        });

        actualizarResumenModal(unidad, version, engancheKey, mensualidad48);
        actualizarPlantillaPDF(unidad, version, info.precio, engancheKey, plazosMap);
    };

    const actualizarPlantillaPDF = (unidad, version, precio, enganche, plazosMap) => {
        const pdfTable = document.querySelector('#pdf-template-container .pdf-table');
        if (pdfTable) {
            const tds = pdfTable.querySelectorAll('td.fw-bold');
            if (tds.length >= 4) {
                tds[0].innerText = unidad;
                tds[1].innerText = version;
                tds[2].innerText = precio;
                tds[3].innerText = enganche;
            }
        }

        const pdfMesTds = document.querySelectorAll('#pdf-template-container .pdf-table-mensualidades td.fw-bold');
        const plazos = ["72", "60", "48", "36"];

        plazos.forEach((plazoKey, index) => {
            if (pdfMesTds[index]) {
                pdfMesTds[index].innerText = plazosMap[plazoKey] || "$0.00";
            }
        });
    };

    // Eventos
    if (selectTipo) selectTipo.addEventListener('change', cargarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', cargarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', cargarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarCalculos);

    // Modal
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

    // PDF / Impresión
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

    // Enlaces Contacto
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
            window.open(`https://wa.me/528448067192?text=${getMensajeContacto()}`, '_blank');
        });
    }

    if (btnEmail) {
        btnEmail.addEventListener('click', () => {
            const asunto = encodeURIComponent('Cotización de vehículo KIA');
            window.location.href = `mailto:abel.ortiz@kiamax.com?subject=${asunto}&body=${getMensajeContacto()}`;
        });
    }

    // Inicialización
    cargarDatos();
});