document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // BASE DE DATOS COMPLETA DESDE EXCEL DE GOOGLE SHEETS
    // =========================================================================
    const vehiculosData = {
        "AUTOMÓVIL": {
            "K3 SEDAN": {
                "L TM": {
                    precio: 304900,
                    enganches: [68491.66, 82516.60, 111955.85]
                },
                "LX TM": {
                    precio: 358600,
                    enganches: [60457.12, 80457.12, 100457.12]
                },
                "LX TA": {
                    precio: 372600,
                    enganches: [75000.00, 95000.00, 115000.00]
                },
                "EX TA": {
                    precio: 400300,
                    enganches: [80000.00, 100000.00, 120000.00]
                },
                "EXPACK TA": {
                    precio: 435900,
                    enganches: [87000.00, 110000.00, 130000.00]
                }
            },
            "K3 HATCHBACK": {
                "LX TM": {
                    precio: 358600,
                    enganches: [80000.00, 100000.00, 120000.00]
                },
                "EX TA": {
                    precio: 400300,
                    enganches: [90000.00, 110000.00, 130000.00]
                },
                "EXPACK TA": {
                    precio: 435900,
                    enganches: [98000.00, 120000.00, 140000.00]
                },
                "GTLINE TA": {
                    precio: 475600,
                    enganches: [105000.00, 130000.00, 150000.00]
                }
            },
            "K4 SEDAN": {
                "LX TM": {
                    precio: 398400,
                    enganches: [89000.00, 110000.00, 130000.00]
                },
                "LX TA": {
                    precio: 415000,
                    enganches: [93000.00, 115000.00, 135000.00]
                },
                "EX TA": {
                    precio: 445000,
                    enganches: [100000.00, 125000.00, 145000.00]
                },
                "GTLINE TA": {
                    precio: 485000,
                    enganches: [110000.00, 135000.00, 155000.00]
                }
            }
        },
        "SUV": {
            "SONET": {
                "LX TM": {
                    precio: 398400,
                    enganches: [86356.18, 100000.00, 120000.00]
                },
                "LX TA": {
                    precio: 418400,
                    enganches: [92000.00, 110000.00, 130000.00]
                },
                "EX TA": {
                    precio: 448400,
                    enganches: [99000.00, 120000.00, 140000.00]
                },
                "SX TA": {
                    precio: 488400,
                    enganches: [108000.00, 130000.00, 150000.00]
                }
            },
            "SELTOS": {
                "LX": {
                    precio: 449900,
                    enganches: [99000.00, 120000.00, 140000.00]
                },
                "EX": {
                    precio: 489900,
                    enganches: [108000.00, 130000.00, 150000.00]
                },
                "EXPACK": {
                    precio: 529900,
                    enganches: [116000.00, 140000.00, 160000.00]
                },
                "SX": {
                    precio: 569900,
                    enganches: [125000.00, 150000.00, 170000.00]
                }
            },
            "SPORTAGE": {
                "EX TA": {
                    precio: 594900,
                    enganches: [130000.00, 155000.00, 180000.00]
                },
                "EXPACK TA": {
                    precio: 644900,
                    enganches: [142000.00, 170000.00, 195000.00]
                },
                "SX TURBO": {
                    precio: 694900,
                    enganches: [153000.00, 180000.00, 210000.00]
                },
                "SXL": {
                    precio: 734900,
                    enganches: [162000.00, 190000.00, 220000.00]
                }
            },
            "SORENTO": {
                "EX TA": {
                    precio: 789900,
                    enganches: [174000.00, 200000.00, 230000.00]
                },
                "EXPACK": {
                    precio: 849900,
                    enganches: [187000.00, 215000.00, 250000.00]
                },
                "SXL": {
                    precio: 909900,
                    enganches: [200000.00, 230000.00, 270000.00]
                }
            }
        },
        "HÍBRIDOS Y ELÉCTRICOS": {
            "NIRO": {
                "EX": {
                    precio: 689700,
                    enganches: [186645.07, 253281.82, 319918.56]
                }
            },
            "SELTOS HIBRIDA": {
                "EX HEV": {
                    precio: 549900,
                    enganches: [121000.00, 145000.00, 170000.00]
                }
            },
            "SPORTAGE HEV": {
                "SXL HEV": {
                    precio: 814900,
                    enganches: [180000.00, 210000.00, 250000.00]
                }
            },
            "EV3": {
                "GT LINE": {
                    precio: 799900,
                    enganches: [175000.00, 205000.00, 240000.00]
                }
            }
        }
    };

    // Referencias DOM
    const selectTipo = document.getElementById('select-tipo');
    const selectUnidad = document.getElementById('select-unidad');
    const selectVersion = document.getElementById('select-version');
    const selectEnganche = document.getElementById('select-enganche');
    const precioListaEl = document.getElementById('precio-lista');
    const mesRows = document.querySelectorAll('.mes-row strong');

    // Elementos del Modal
    const btnContact = document.getElementById('btn-contact');
    const modal = document.getElementById('contact-modal');
    const btnClose = document.getElementById('close-modal');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnEmail = document.getElementById('btn-email');
    const btnPdfModal = document.getElementById('btn-pdf-modal');
    const btnPdfMain = document.getElementById('btn-pdf-main');

    // Formateador de moneda
    const formatearMoneda = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

    // Calcular Mensualidad con tasa fija 12.99%
    const calcularMensualidad = (montoFinanciar, plazoMeses, tasaAnual = 0.1299) => {
        const tasaMensual = tasaAnual / 12;
        return (montoFinanciar * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazoMeses));
    };

    // Actualizar Resumen en Vivo dentro del Modal
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

    // Lógica Principal de Cálculo
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

        // Actualizar Resumen en Modal y Plantilla de PDF
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

    // Llenar Selects en Cascada
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

    // Escuchar cambios
    if (selectTipo) selectTipo.addEventListener('change', cargarUnidades);
    if (selectUnidad) selectUnidad.addEventListener('change', cargarVersiones);
    if (selectVersion) selectVersion.addEventListener('change', cargarEnganches);
    if (selectEnganche) selectEnganche.addEventListener('change', actualizarCalculos);

    // Impresión PDF
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

    // Modal de Contacto
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

    // Armar mensaje formateado para enviar al Asesor
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

    // Inicializar
    poblarSelectTipos();
});