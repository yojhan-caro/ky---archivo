/* ══════════════════════════════════════════════════════════════
   KY SpA Archivo — contenido base (semilla)
   Esto es lo que trae la app la primera vez. Después, todo lo que
   escribes (notas, tareas, carpetas nuevas) se guarda en el
   dispositivo y no se pisa al actualizar este archivo.
   Para agregar una carpeta base nueva en una versión futura, súmala
   aquí con un id nuevo: la app la agrega sin tocar lo tuyo.
   ══════════════════════════════════════════════════════════════ */
window.KY_SEED = {
  version: 1,
  empresa: { nombre: 'KY SpA', duenio: 'Yojhan Furuya', rut: '78.563.057-2', lugar: 'Viña del Mar · Chile' },
  folders: [
    { id: 'empresa', name: 'Empresa', color: '#5D1650', date: '21 nov 2026',
      peek: 'KY SpA ya existe: constituida el 21 de noviembre. Falta el inicio de actividades en el SII.',
      title: 'KY SpA',
      lead: 'La empresa madre. Debajo de ella viven las marcas: KY Systems para software (Pulso es el primer producto) y KY Studio para diseño.',
      sections: [
        { h: 'Trámites', list: [['ok', 'Constitución firmada con firma electrónica (FirmAki) en Tu Empresa en un Día'], ['ok', 'Clave Tributaria personal creada (el SII la exige para el inicio de actividades)'], ['wait', 'Inicio de actividades en el SII: guardado sin enviar. Se termina en diciembre, con el domicilio nuevo, o al primer pago de Sikdorak'], ['wait', 'Cuenta bancaria de la empresa (después del inicio de actividades)'], ['wait', 'Patente municipal (después de la mudanza)']] },
        { h: 'Inicio de actividades preparado', list: ['Actividades: 620200 consultoría informática, 631100 procesamiento de datos y hosting, 731001 publicidad', 'Giro: «Desarrollo y arriendo de software, sistemas web y diseño digital»', 'Régimen: Pro Pyme Transparente', 'Domicilio: el depto se declara como «cedido»; se necesita el RUT del dueño del inmueble'] },
        { h: 'Mientras tanto', p: 'Los primeros pagos se cobran con boleta de honorarios a nombre de Yojhan. Desde el inicio de actividades, el F29 se declara todos los meses, aunque sea en cero.' }
      ],
      ficha: [['Razón social', 'KY SpA'], ['RUT', '78.563.057-2'], ['Constitución', '21-11-2026'], ['N° atención', '15425614'], ['Domicilio', 'Viña del Mar']],
      ex: { h: 'Las marcas', rows: [['KY SpA', 'empresa'], ['KY Systems', 'software · Pulso'], ['KY Studio', 'diseño'], ['kysystems.cl', 'dominio libre'], ['kystudio.cl', 'dominio libre']] } },

    { id: 'pulso', name: 'Pulso', color: '#EB5B1E', date: 'v1.9.6',
      peek: 'El sistema de comandas. Probado con la ticketera real; listo para subir a internet.',
      title: 'Pulso',
      lead: 'Sistema de comandas para restaurantes: garzón en el celular, cocina, ticketeras, caja, inventario con recetas y boleta electrónica. Primer activo de la empresa.',
      sections: [
        { h: 'Probado el 23 de noviembre con la ticketera real', list: [['ok', 'Comanda de cocina, copia para garzones y pre-cuenta salen bien'], ['ok', 'Si cambian la ticketera de puerto USB, sigue imprimiendo sola'], ['ok', 'Nunca manda tickets a otra impresora (por ejemplo, la de oficina)'], ['ok', 'El agente se actualiza solo, nunca en pleno servicio, y se repara si le falta un archivo'], ['ok', 'Marca cambiada a «by KY Systems» en todo el sistema']] },
        { h: 'Por revisar', list: [['wait', 'Medir cuánto tarda en salir la comanda en Sikdorak (antes ~6 s; debería bajar a 1–2 s)'], ['wait', 'Poner el logo nuevo (el ticket coral) dentro del sistema'], ['wait', 'Boleta electrónica en producción con el RUT de la empresa']] }
      ],
      ficha: [['Versión', 'Pulso 1.9.6'], ['Agente', '2.2.3 (Windows)'], ['Paquete', 'pulso_v1.9.6.zip'], ['Hecho con', 'PHP 8 · MariaDB · JS'], ['Impresoras', 'USB y red, ESC/POS']],
      ex: { h: 'En números', big: ['1', 'primer cliente: Sikdorak'], rows: [['Áreas', 'salón · cocina · caja'], ['Impresoras', 'ilimitadas'], ['Usuarios', 'ilimitados']] } },

    { id: 'produccion', name: 'Producción', color: '#11735A', date: 'fin de mes',
      peek: 'Subir Pulso a internet: dominio, servidor y la instalación paso a paso. Espera el dinero de fin de mes.',
      title: 'A internet',
      lead: 'Un servidor en Santiago atiende a todos los clientes. Cada restaurante tiene su propia dirección y su propia base de datos: los datos nunca se mezclan.',
      sections: [
        { h: 'Lo que hay que comprar', table: { head: ['Qué', 'Dónde', 'Costo'], num: [2], rows: [['Dominio pulsopos.cl, a nombre de KY SpA', 'nic.cl', '~$9.950 + IVA/año'], ['Servidor 2 GB, región Santiago', 'vultr.com', '~US$12/mes'], ['Respaldo automático del servidor', 'Vultr', '+20%'], ['Candado HTTPS', 'Let’s Encrypt', 'gratis'], ['Aviso si se cae', 'UptimeRobot', 'gratis']] } },
        { h: 'El orden', list: ['Comprar el dominio y crear la cuenta de Vultr con verificación en 2 pasos', 'Generar la llave SSH en el PC (lo hacemos juntos)', 'Crear el servidor y apuntar el dominio (pulsopos.cl, www, sikdorak, demo)', 'Instalar con un comando: queda sikdorak.pulsopos.cl con HTTPS y respaldo diario a las 04:00', 'Publicar la landing: pulso-landing pulsopos.cl', 'Crear la demo para mostrar a otros restaurantes'] },
        { p: 'La guía completa está en el paquete de Pulso, en deploy/GUIA-PRODUCCION.md.' }
      ],
      ficha: [['Landing', 'pulsopos.cl'], ['Cliente 1', 'sikdorak.pulsopos.cl'], ['Demo', 'demo.pulsopos.cl'], ['Servidor', 'Ubuntu 24.04'], ['Respaldo', 'diario 04:00']],
      ex: { h: 'Costo al mes', big: ['~$15 mil', 'servidor + respaldo, aprox.'], rows: [['Dominio', '~$1 mil/mes'], ['Se paga con', '1 local en plan Completo']] } },

    { id: 'ventas', name: 'Ventas', color: '#D6262B', date: '+ IVA',
      peek: 'Planes, precio fijo y plan fundador. Comparación con la competencia.',
      title: 'Planes',
      lead: 'Precio fijo por local, sin porcentaje de las ventas. Usuarios e impresoras ilimitados, actualizaciones y soporte por WhatsApp incluidos.',
      sections: [
        { table: { head: ['Plan', 'Incluye', 'Mes'], num: [2], rows: [['Salón', 'Garzón en el celular, cocina, ticketeras, caja, propinas, reportes', '$29.990'], ['Completo', 'Salón + inventario con recetas y costos, compras, boleta y factura electrónica, permisos', '$49.990'], ['Cadena', 'Completo + varios locales, carta copiada, soporte prioritario. Local extra $39.990', '$79.990']] } },
        { list: ['Puesta en marcha: $149.990, pago único (carta, impresoras y capacitación en el local)', 'Plan fundador para los primeros 5 locales: puesta en marcha gratis y precio congelado por 12 meses. Sikdorak entra aquí', 'Sin contrato de permanencia: mes a mes'] },
        { h: 'La competencia (noviembre 2026)', table: { head: ['Sistema', 'Precio al mes', 'Ojo con'], rows: [['Fudo', '$25.500 · $34.500 · $52.500', 'módulos aparte'], ['Toteat', '$39.900 + 0,7% de las ventas', 'con $10 M en ventas paga ~$110 mil'], ['Cypro', '$39.990 – $79.990', 'precio fijo'], ['Justo', '2,5 UF', 'enfocado en delivery']] } },
        { p: 'Argumento: todo incluido, precio fijo, hecho en Chile y con la impresión a prueba de todo.' }
      ],
      ficha: [['Salón', '$29.990'], ['Completo', '$49.990'], ['Cadena', '$79.990'], ['Local extra', '$39.990'], ['Instalación', '$149.990'], ['Fundador', '5 cupos']],
      ex: { h: 'El ejemplo', rows: [['Local con $10 M en ventas', ''], ['Sistema con 0,7%', '~$109.900'], ['Pulso Completo', '$49.990']] } },

    { id: 'meta', name: 'Meta', color: '#4A1C74', date: '$1,2 M/mes',
      peek: 'Cuántos restaurantes hacen falta para un sueldo de más de un millón al mes.',
      title: 'La meta',
      lead: 'Más de $1.200.000 al mes libres, con unos $80 mil de costos. El IVA se cobra encima y se le paga al SII.',
      sections: [
        { table: { head: ['Si los locales eligen…', 'Promedio', 'Locales'], num: [1, 2], rows: [['Todos Salón', '$29.990', '43'], ['Mezcla realista: 30% Salón, 60% Completo, 10% Cadena', '$46.990', '28'], ['Todos Completo', '$49.990', '26']] } },
        { h: 'A 3 locales nuevos por mes', list: ['Mes 4: se pasa el millón contando las puestas en marcha', 'Mes 8–9: se pasa el millón solo con las mensualidades', 'Mes 12: ~36 locales y ~$1,7 millones al mes fijos'] },
        { p: 'Lo que mueve la meta es conseguir 3 locales al mes: la landing, una demo convincente y Sikdorak como primer caso real.' }
      ],
      ficha: [['Objetivo', '$1,2 M/mes'], ['Locales', '~28'], ['Ritmo', '3 por mes'], ['Plazo', '8–9 meses']],
      ex: { h: 'El número', big: ['28', 'locales para pasar el millón'] } },

    { id: 'marca', name: 'Marca', color: '#C93F78', date: 'logo F1',
      peek: 'Logo elegido, colores, tipografías y la landing de pulsopos.cl.',
      title: 'La marca',
      lead: 'Pulso usa el logo F1: la silueta de una comanda en coral con el latido blanco adentro, y «pulso» en letra gordita, blanca sobre fondo oscuro.',
      sections: [
        { h: 'Identidad', list: ['Coral #E8553D, tinta #141416, crema #FAF8F5', 'Títulos: Plus Jakarta Sans 800 · Texto: Inter', 'Lienzo del logo: «Pulso — Logo», fila Fusión, F1'] },
        { h: 'Landing de pulsopos.cl', list: [['ok', 'Hecha: portada, cómo funciona, 8 funciones, impresión, comparación de precio, planes, preguntas y formulario de demo por WhatsApp'], ['wait', 'Poner el número de WhatsApp antes de publicar'], ['wait', 'Sumar el caso de Sikdorak cuando esté funcionando (sin testimonios inventados)']] },
        { h: 'Cuidado legal', p: 'pulso.cl es de COPESA (Diario Pulso). Antes de crecer, revisar en INAPI que «Pulso» esté libre en software (clases 9 y 42) y registrarla.' }
      ],
      ficha: [['Logo', 'F1 · Ticket'], ['Coral', '#E8553D'], ['Tinta', '#141416'], ['Títulos', 'Plus Jakarta Sans'], ['Landing', 'lista, sin publicar']],
      ex: { h: 'Muestra', swatch: true } },

    { id: 'clientes', name: 'Clientes', color: '#0F6E7A', date: '1 activo',
      peek: 'Sikdorak, el primer restaurante, en plan fundador.',
      title: 'Clientes',
      lead: 'Sikdorak es el primer cliente y el caso que va a abrir la puerta a los siguientes.',
      sections: [
        { h: 'Sikdorak · plan fundador', list: [['ok', 'Sistema configurado y probado con su ticketera'], ['wait', 'Instalar en sikdorak.pulsopos.cl cuando el servidor esté listo'], ['wait', 'Conectar el PC de caja con el agente e imprimir la prueba en el local'], ['wait', 'Prueba de 10 minutos con el dueño antes del primer servicio'], ['wait', 'Cambiar el PIN de administrador (no dejar 1234)'], ['wait', 'Medir el tiempo de impresión con la primera comanda real']] },
        { h: 'Los siguientes', p: 'Con la demo en demo.pulsopos.cl y la landing publicada, la meta es sumar 3 locales por mes. Anota cada uno en la bitácora de esta carpeta, con su plan y su fecha de inicio.' }
      ],
      ficha: [['Cliente 1', 'Sikdorak'], ['Plan', 'Fundador'], ['Dirección', 'sikdorak.pulsopos.cl'], ['Estado', 'por instalar']],
      ex: { h: 'Cupos fundador', big: ['1 / 5', 'usados'] } },

    { id: 'pendientes', name: 'Pendientes', color: '#2342D6', date: 'hoy',
      peek: 'Lo que viene, en orden. Marca cada tarea cuando la termines.',
      title: 'Pendientes',
      lead: 'Ordenados por cuándo se pueden hacer. Agrega las tuyas abajo.',
      sections: [],
      ficha: null, ex: null,
      tasks: [
        ['Ahora, sin gastar', 'Revisar en INAPI si «Pulso» está libre en software', 'clases 9 y 42'],
        ['Ahora, sin gastar', 'Poner el número de WhatsApp en la landing', ''],
        ['Ahora, sin gastar', 'Logo nuevo dentro del sistema', 'reemplaza el ícono antiguo'],
        ['Ahora, sin gastar', 'Preparar la demo con una carta de ejemplo', 'para visitar restaurantes'],
        ['Ahora, sin gastar', 'Cambiar el PIN 1234 de administrador', ''],
        ['Fin de mes, con dinero', 'Comprar pulsopos.cl a nombre de KY SpA', 'nic.cl · ~$11.800 al año'],
        ['Fin de mes, con dinero', 'Crear cuenta en Vultr con verificación en 2 pasos', '~US$12 al mes'],
        ['Fin de mes, con dinero', 'Instalar el servidor y Sikdorak', 'unos 30 minutos'],
        ['Fin de mes, con dinero', 'Publicar la landing', 'pulso-landing pulsopos.cl'],
        ['Diciembre', 'Terminar el inicio de actividades con el domicilio nuevo', 'RUT del dueño del depto'],
        ['Diciembre', 'Abrir la cuenta bancaria de KY SpA', ''],
        ['Diciembre', 'Boleta electrónica con el RUT de la empresa', ''],
        ['Después', 'Patente municipal', ''],
        ['Después', 'Registrar los dominios kysystems.cl y kystudio.cl', ''],
        ['Después', 'Primeros 3 locales nuevos', 'meta: 3 por mes']
      ] }
  ]
};
