// lib/data/costa-rica-locations.ts
// Lista de provincias, cantones y distritos de Costa Rica

export interface Distrito {
  nombre: string;
}

export interface Canton {
  nombre: string;
  distritos: Distrito[];
}

export interface Provincia {
  nombre: string;
  cantones: Canton[];
}

export const provincias: Provincia[] = [
  // San José
  {
    nombre: "San José",
    cantones: [
      {
        nombre: "San José",
        distritos: [
          { nombre: "Carmen" },
          { nombre: "Merced" },
          { nombre: "Hospital" },
          { nombre: "Catedral" },
          { nombre: "Zapote" },
          { nombre: "San Francisco de Dos Ríos" },
          { nombre: "Uruca" },
          { nombre: "Mata Redonda" },
          { nombre: "Pavas" },
          { nombre: "Hatillo" },
          { nombre: "San Sebastián" },
        ],
      },
      {
        nombre: "Escazú",
        distritos: [
          { nombre: "Escazú" },
          { nombre: "San Antonio" },
          { nombre: "San Rafael" },
        ],
      },
      {
        nombre: "Desamparados",
        distritos: [
          { nombre: "Desamparados" },
          { nombre: "San Miguel" },
          { nombre: "San Juan de Dios" },
          { nombre: "San Rafael Arriba" },
          { nombre: "San Antonio" },
          { nombre: "Frailes" },
          { nombre: "Patarrá" },
          { nombre: "San Cristóbal" },
          { nombre: "Rosario" },
          { nombre: "Damas" },
          { nombre: "San Rafael Abajo" },
          { nombre: "Gravilias" },
          { nombre: "Los Guido" },
        ],
      },
      {
        nombre: "Puriscal",
        distritos: [
          { nombre: "Santiago" },
          { nombre: "Mercedes Sur" },
          { nombre: "Barbacoas" },
          { nombre: "Grifo Alto" },
          { nombre: "San Rafael" },
          { nombre: "Candelarita" },
          { nombre: "Desamparaditos" },
          { nombre: "San Antonio" },
          { nombre: "Chires" },
        ],
      },
      {
        nombre: "Tarrazú",
        distritos: [
          { nombre: "San Marcos" },
          { nombre: "San Lorenzo" },
          { nombre: "San Carlos" },
        ],
      },
      {
        nombre: "Aserrí",
        distritos: [
          { nombre: "Aserrí" },
          { nombre: "Tarbaca" },
          { nombre: "Vuelta de Jorco" },
          { nombre: "San Gabriel" },
          { nombre: "Legua" },
          { nombre: "Monterrey" },
          { nombre: "Salitrillos" },
        ],
      },
      {
        nombre: "Mora",
        distritos: [
          { nombre: "Colón" },
          { nombre: "Guayabo" },
          { nombre: "Tabarcia" },
          { nombre: "Piedras Negras" },
          { nombre: "Picagres" },
          { nombre: "Jaris" },
          { nombre: "Quitirrisí" },
        ],
      },
      {
        nombre: "Goicoechea",
        distritos: [
          { nombre: "Guadalupe" },
          { nombre: "San Francisco" },
          { nombre: "Calle Blancos" },
          { nombre: "Mata de Plátano" },
          { nombre: "Ipís" },
          { nombre: "Rancho Redondo" },
          { nombre: "Purral" },
        ],
      },
      {
        nombre: "Santa Ana",
        distritos: [
          { nombre: "Santa Ana" },
          { nombre: "Salitral" },
          { nombre: "Pozos" },
          { nombre: "Uruca" },
          { nombre: "Piedades" },
          { nombre: "Brasil" },
        ],
      },
      {
        nombre: "Alajuelita",
        distritos: [
          { nombre: "Alajuelita" },
          { nombre: "San Josecito" },
          { nombre: "San Antonio" },
          { nombre: "Concepción" },
          { nombre: "San Felipe" },
        ],
      },
      {
        nombre: "Vásquez de Coronado",
        distritos: [
          { nombre: "San Isidro" },
          { nombre: "San Rafael" },
          { nombre: "Dulce Nombre de Jesús" },
          { nombre: "Patalillo" },
          { nombre: "Cascajal" },
        ],
      },
      {
        nombre: "Acosta",
        distritos: [
          { nombre: "San Ignacio" },
          { nombre: "Guaitil" },
          { nombre: "Palmichal" },
          { nombre: "Cangrejal" },
          { nombre: "Sabanillas" },
        ],
      },
      {
        nombre: "Tibás",
        distritos: [
          { nombre: "San Juan" },
          { nombre: "Cinco Esquinas" },
          { nombre: "Anselmo Llorente" },
          { nombre: "León XIII" },
          { nombre: "Colima" },
        ],
      },
      {
        nombre: "Moravia",
        distritos: [
          { nombre: "San Vicente" },
          { nombre: "San Jerónimo" },
          { nombre: "La Trinidad" },
        ],
      },
      {
        nombre: "Montes de Oca",
        distritos: [
          { nombre: "San Pedro" },
          { nombre: "Sabanilla" },
          { nombre: "Mercedes" },
          { nombre: "San Rafael" },
        ],
      },
      {
        nombre: "Turrubares",
        distritos: [
          { nombre: "San Pablo" },
          { nombre: "San Pedro" },
          { nombre: "San Juan de Mata" },
          { nombre: "San Luis" },
          { nombre: "Carara" },
        ],
      },
      {
        nombre: "Dota",
        distritos: [
          { nombre: "Santa María" },
          { nombre: "Jardín" },
          { nombre: "Copey" },
        ],
      },
      {
        nombre: "Curridabat",
        distritos: [
          { nombre: "Curridabat" },
          { nombre: "Granadilla" },
          { nombre: "Sánchez" },
          { nombre: "Tirrases" },
        ],
      },
      {
        nombre: "Pérez Zeledón",
        distritos: [
          { nombre: "San Isidro de El General" },
          { nombre: "El General" },
          { nombre: "Daniel Flores" },
          { nombre: "Rivas" },
          { nombre: "San Pedro" },
          { nombre: "Platanares" },
          { nombre: "Pejibaye" },
          { nombre: "Cajón" },
          { nombre: "Barú" },
          { nombre: "Río Nuevo" },
          { nombre: "Páramo" },
        ],
      },
      {
        nombre: "León Cortés Castro",
        distritos: [
          { nombre: "San Pablo" },
          { nombre: "San Andrés" },
          { nombre: "Llano Bonito" },
          { nombre: "San Isidro" },
          { nombre: "Santa Cruz" },
          { nombre: "San Antonio" },
        ],
      },
    ],
  },
  // Alajuela
  {
    nombre: "Alajuela",
    cantones: [
      {
        nombre: "Alajuela",
        distritos: [
          { nombre: "Alajuela" },
          { nombre: "San José" },
          { nombre: "Carrizal" },
          { nombre: "San Antonio" },
          { nombre: "Guácima" },
          { nombre: "San Isidro" },
          { nombre: "Sabanilla" },
          { nombre: "San Rafael" },
          { nombre: "Río Segundo" },
          { nombre: "Desamparados" },
          { nombre: "Turrúcares" },
          { nombre: "Tambor" },
          { nombre: "Garita" },
          { nombre: "Sarapiquí" },
        ],
      },
      {
        nombre: "San Ramón",
        distritos: [
          { nombre: "San Ramón" },
          { nombre: "Santiago" },
          { nombre: "San Juan" },
          { nombre: "Piedades Norte" },
          { nombre: "Piedades Sur" },
          { nombre: "San Rafael" },
          { nombre: "San Isidro" },
          { nombre: "Ángeles" },
          { nombre: "Alfaro" },
          { nombre: "Volio" },
          { nombre: "Concepción" },
          { nombre: "Zapotal" },
          { nombre: "Peñas Blancas" },
        ],
      },
      {
        nombre: "Grecia",
        distritos: [
          { nombre: "Grecia" },
          { nombre: "San Isidro" },
          { nombre: "San José" },
          { nombre: "San Roque" },
          { nombre: "Tacares" },
          { nombre: "Río Cuarto" },
          { nombre: "Puente de Piedra" },
          { nombre: "Bolívar" },
        ],
      },
      {
        nombre: "San Mateo",
        distritos: [
          { nombre: "San Mateo" },
          { nombre: "Desmonte" },
          { nombre: "Jesús María" },
          { nombre: "Labrador" },
        ],
      },
      {
        nombre: "Atenas",
        distritos: [
          { nombre: "Atenas" },
          { nombre: "Jesús" },
          { nombre: "Mercedes" },
          { nombre: "San Isidro" },
          { nombre: "Concepción" },
          { nombre: "San José" },
          { nombre: "Santa Eulalia" },
          { nombre: "Escobal" },
        ],
      },
      {
        nombre: "Naranjo",
        distritos: [
          { nombre: "Naranjo" },
          { nombre: "San Miguel" },
          { nombre: "San José" },
          { nombre: "Cirrí Sur" },
          { nombre: "San Jerónimo" },
          { nombre: "San Juan" },
          { nombre: "El Rosario" },
          { nombre: "Palmitos" },
        ],
      },
      {
        nombre: "Palmares",
        distritos: [
          { nombre: "Palmares" },
          { nombre: "Zaragoza" },
          { nombre: "Buenos Aires" },
          { nombre: "Santiago" },
          { nombre: "Candelaria" },
          { nombre: "Esquipulas" },
          { nombre: "La Granja" },
        ],
      },
      {
        nombre: "Poás",
        distritos: [
          { nombre: "San Pedro" },
          { nombre: "San Juan" },
          { nombre: "San Rafael" },
          { nombre: "Carrillos" },
          { nombre: "Sabana Redonda" },
        ],
      },
      {
        nombre: "Orotina",
        distritos: [
          { nombre: "Orotina" },
          { nombre: "El Mastate" },
          { nombre: "Hacienda Vieja" },
          { nombre: "Coyolar" },
          { nombre: "La Ceiba" },
        ],
      },
      {
        nombre: "San Carlos",
        distritos: [
          { nombre: "Quesada" },
          { nombre: "Florencia" },
          { nombre: "Buenavista" },
          { nombre: "Aguas Zarcas" },
          { nombre: "Venecia" },
          { nombre: "Pital" },
          { nombre: "La Fortuna" },
          { nombre: "La Tigra" },
          { nombre: "La Palmera" },
          { nombre: "Venado" },
          { nombre: "Cutris" },
          { nombre: "Monterrey" },
          { nombre: "Pocosol" },
        ],
      },
      {
        nombre: "Zarcero",
        distritos: [
          { nombre: "Zarcero" },
          { nombre: "Laguna" },
          { nombre: "Tapesco" },
          { nombre: "Guadalupe" },
          { nombre: "Palmira" },
          { nombre: "Zapote" },
          { nombre: "Brisas" },
        ],
      },
      {
        nombre: "Valverde Vega",
        distritos: [
          { nombre: "Sarchí Norte" },
          { nombre: "Sarchí Sur" },
          { nombre: "Toro Amarillo" },
          { nombre: "San Pedro" },
          { nombre: "Rodríguez" },
        ],
      },
      {
        nombre: "Upala",
        distritos: [
          { nombre: "Upala" },
          { nombre: "Aguas Claras" },
          { nombre: "San José (Upala)" },
          { nombre: "Bijagua" },
          { nombre: "Delicias" },
          { nombre: "Dos Ríos" },
          { nombre: "Yolillal" },
        ],
      },
      {
        nombre: "Los Chiles",
        distritos: [
          { nombre: "Los Chiles" },
          { nombre: "Caño Negro" },
          { nombre: "El Amparo" },
          { nombre: "San Jorge" },
        ],
      },
      {
        nombre: "Guatuso",
        distritos: [
          { nombre: "San Rafael" },
          { nombre: "Buenavista" },
          { nombre: "Cote" },
          { nombre: "Katira" },
        ],
      },
    ],
  },
  // Cartago
  {
    nombre: "Cartago",
    cantones: [
      {
        nombre: "Cartago",
        distritos: [
          { nombre: "Oriental" },
          { nombre: "Occidental" },
          { nombre: "Carmen" },
          { nombre: "San Nicolás" },
          { nombre: "Aguacaliente" },
          { nombre: "Guadalupe" },
          { nombre: "Corralillo" },
          { nombre: "Tierra Blanca" },
          { nombre: "Dulce Nombre" },
          { nombre: "Llano Grande" },
          { nombre: "Quebradilla" },
        ],
      },
      {
        nombre: "Paraíso",
        distritos: [
          { nombre: "Paraíso" },
          { nombre: "Santiago" },
          { nombre: "Orosi" },
          { nombre: "Cachí" },
          { nombre: "Llanos de Santa Lucía" },
        ],
      },
      {
        nombre: "La Unión",
        distritos: [
          { nombre: "Tres Ríos" },
          { nombre: "San Diego" },
          { nombre: "San Juan" },
          { nombre: "San Rafael" },
          { nombre: "Concepción" },
          { nombre: "Dulce Nombre" },
          { nombre: "San Ramón" },
          { nombre: "Río Azul" },
        ],
      },
      {
        nombre: "Jiménez",
        distritos: [
          { nombre: "Juan Viñas" },
          { nombre: "Tucurrique" },
          { nombre: "Pejibaye" },
        ],
      },
      {
        nombre: "Turrialba",
        distritos: [
          { nombre: "Turrialba" },
          { nombre: "La Suiza" },
          { nombre: "Peralta" },
          { nombre: "Santa Cruz" },
          { nombre: "Santa Rosa" },
          { nombre: "Pavones" },
          { nombre: "Tuis" },
          { nombre: "Tayutic" },
          { nombre: "Santa Teresita" },
          { nombre: "La Isabel" },
          { nombre: "Chirripó" },
        ],
      },
      {
        nombre: "Alvarado",
        distritos: [
          { nombre: "Pacayas" },
          { nombre: "Cervantes" },
          { nombre: "Capellades" },
        ],
      },
      {
        nombre: "Oreamuno",
        distritos: [
          { nombre: "San Rafael" },
          { nombre: "Cot" },
          { nombre: "Potrero Cerrado" },
          { nombre: "Cipreses" },
          { nombre: "Santa Rosa" },
        ],
      },
      {
        nombre: "El Guarco",
        distritos: [
          { nombre: "Tejar" },
          { nombre: "San Isidro" },
          { nombre: "Tobosi" },
          { nombre: "Patio de Agua" },
        ],
      },
    ],
  },
  // Heredia
  {
    nombre: "Heredia",
    cantones: [
      {
        nombre: "Heredia",
        distritos: [
          { nombre: "Heredia" },
          { nombre: "Mercedes" },
          { nombre: "San Francisco" },
          { nombre: "Ulloa" },
          { nombre: "Varablanca" },
        ],
      },
      {
        nombre: "Barva",
        distritos: [
          { nombre: "Barva" },
          { nombre: "San Pedro" },
          { nombre: "San Pablo" },
          { nombre: "San Roque" },
          { nombre: "Santa Lucía" },
          { nombre: "San José de la Montaña" },
        ],
      },
      {
        nombre: "Santo Domingo",
        distritos: [
          { nombre: "Santo Domingo" },
          { nombre: "San Vicente" },
          { nombre: "San Miguel" },
          { nombre: "Paracito" },
          { nombre: "Santo Tomás" },
          { nombre: "Santa Rosa" },
          { nombre: "Tures" },
          { nombre: "Pará" },
        ],
      },
      {
        nombre: "Santa Bárbara",
        distritos: [
          { nombre: "Santa Bárbara" },
          { nombre: "San Pedro" },
          { nombre: "San Juan" },
          { nombre: "Jesús" },
          { nombre: "Santo Domingo" },
          { nombre: "Purabá" },
        ],
      },
      {
        nombre: "San Rafael",
        distritos: [
          { nombre: "San Rafael" },
          { nombre: "San Josecito" },
          { nombre: "Santiago" },
          { nombre: "Ángeles" },
          { nombre: "Concepción" },
        ],
      },
      {
        nombre: "San Isidro",
        distritos: [
          { nombre: "San Isidro" },
          { nombre: "San José" },
          { nombre: "Concepción" },
        ],
      },
      {
        nombre: "Belén",
        distritos: [
          { nombre: "San Antonio" },
          { nombre: "La Ribera" },
          { nombre: "La Asunción" },
        ],
      },
      {
        nombre: "Flores",
        distritos: [
          { nombre: "San Joaquín" },
          { nombre: "Barrantes" },
          { nombre: "Llorente" },
        ],
      },
      {
        nombre: "San Pablo",
        distritos: [{ nombre: "San Pablo" }, { nombre: "Rincón de Sabanilla" }],
      },
      {
        nombre: "Sarapiquí",
        distritos: [
          { nombre: "Puerto Viejo" },
          { nombre: "La Virgen" },
          { nombre: "Las Horquetas" },
          { nombre: "Llanuras del Gaspar" },
          { nombre: "Cureña" },
        ],
      },
    ],
  },
  // Guanacaste
  {
    nombre: "Guanacaste",
    cantones: [
      {
        nombre: "Liberia",
        distritos: [
          { nombre: "Liberia" },
          { nombre: "Cañas Dulces" },
          { nombre: "Mayorga" },
          { nombre: "Nacascolo" },
          { nombre: "Curubandé" },
        ],
      },
      {
        nombre: "Nicoya",
        distritos: [
          { nombre: "Nicoya" },
          { nombre: "Mansión" },
          { nombre: "San Antonio" },
          { nombre: "Quebrada Honda" },
          { nombre: "Sámara" },
          { nombre: "Nosara" },
          { nombre: "Belén de Nosarita" },
        ],
      },
      {
        nombre: "Santa Cruz",
        distritos: [
          { nombre: "Santa Cruz" },
          { nombre: "Bolsón" },
          { nombre: "Veintisiete de Abril" },
          { nombre: "Tempate" },
          { nombre: "Cartagena" },
          { nombre: "Cuajiniquil" },
          { nombre: "Diriá" },
          { nombre: "Cabo Velas" },
          { nombre: "Tamarindo" },
        ],
      },
      {
        nombre: "Bagaces",
        distritos: [
          { nombre: "Bagaces" },
          { nombre: "La Fortuna" },
          { nombre: "Mogote" },
          { nombre: "Río Naranjo" },
        ],
      },
      {
        nombre: "Carrillo",
        distritos: [
          { nombre: "Filadelfia" },
          { nombre: "Palmira" },
          { nombre: "Sardinal" },
          { nombre: "Belén" },
        ],
      },
      {
        nombre: "Cañas",
        distritos: [
          { nombre: "Cañas" },
          { nombre: "Palmira" },
          { nombre: "San Miguel" },
          { nombre: "Bebedero" },
          { nombre: "Porozal" },
        ],
      },
      {
        nombre: "Abangares",
        distritos: [
          { nombre: "Las Juntas" },
          { nombre: "Sierra" },
          { nombre: "San Juan" },
          { nombre: "Colorado" },
        ],
      },
      {
        nombre: "Tilarán",
        distritos: [
          { nombre: "Tilarán" },
          { nombre: "Quebrada Grande" },
          { nombre: "Tronadora" },
          { nombre: "Santa Rosa" },
          { nombre: "Líbano" },
          { nombre: "Tierras Morenas" },
          { nombre: "Arenal" },
          { nombre: "Cabeceras" },
        ],
      },
      {
        nombre: "Nandayure",
        distritos: [
          { nombre: "Carmona" },
          { nombre: "Santa Rita" },
          { nombre: "Zapotal" },
          { nombre: "San Pablo" },
          { nombre: "Porvenir" },
          { nombre: "Bejuco" },
        ],
      },
      {
        nombre: "La Cruz",
        distritos: [
          { nombre: "La Cruz" },
          { nombre: "Santa Cecilia" },
          { nombre: "La Garita" },
          { nombre: "Santa Elena" },
        ],
      },
      {
        nombre: "Hojancha",
        distritos: [
          { nombre: "Hojancha" },
          { nombre: "Monte Romo" },
          { nombre: "Puerto Carrillo" },
          { nombre: "Huacas" },
        ],
      },
    ],
  },
  // Puntarenas
  {
    nombre: "Puntarenas",
    cantones: [
      {
        nombre: "Puntarenas",
        distritos: [
          { nombre: "Puntarenas" },
          { nombre: "Pitahaya" },
          { nombre: "Chomes" },
          { nombre: "Lepanto" },
          { nombre: "Paquera" },
          { nombre: "Manzanillo" },
          { nombre: "Guacimal" },
          { nombre: "Barranca" },
          { nombre: "Monte Verde" },
          { nombre: "Isla del Coco" },
          { nombre: "Cóbano" },
          { nombre: "Chacarita" },
          { nombre: "Chira" },
          { nombre: "Acapulco" },
          { nombre: "El Roble" },
          { nombre: "Arancibia" },
        ],
      },
      {
        nombre: "Esparza",
        distritos: [
          { nombre: "Espíritu Santo" },
          { nombre: "San Juan Grande" },
          { nombre: "Macacona" },
          { nombre: "San Rafael" },
          { nombre: "San Jerónimo" },
        ],
      },
      {
        nombre: "Buenos Aires",
        distritos: [
          { nombre: "Buenos Aires" },
          { nombre: "Volcán" },
          { nombre: "Potrero Grande" },
          { nombre: "Boruca" },
          { nombre: "Pilas" },
          { nombre: "Colinas" },
          { nombre: "Chánguena" },
          { nombre: "Biolley" },
          { nombre: "Brunka" },
        ],
      },
      {
        nombre: "Montes de Oro",
        distritos: [
          { nombre: "Miramar" },
          { nombre: "La Unión" },
          { nombre: "San Isidro" },
        ],
      },
      {
        nombre: "Osa",
        distritos: [
          { nombre: "Puerto Cortés" },
          { nombre: "Palmar" },
          { nombre: "Sierpe" },
          { nombre: "Bahía Ballena" },
          { nombre: "Piedras Blancas" },
        ],
      },
      {
        nombre: "Quepos",
        distritos: [
          { nombre: "Quepos" },
          { nombre: "Savegre" },
          { nombre: "Naranjito" },
        ],
      },
      {
        nombre: "Golfito",
        distritos: [
          { nombre: "Golfito" },
          { nombre: "Puerto Jiménez" },
          { nombre: "Guaycará" },
          { nombre: "Pavón" },
        ],
      },
      {
        nombre: "Coto Brus",
        distritos: [
          { nombre: "San Vito" },
          { nombre: "Sabalito" },
          { nombre: "Aguabuena" },
          { nombre: "Limoncito" },
          { nombre: "Pittier" },
        ],
      },
      { nombre: "Parrita", distritos: [{ nombre: "Parrita" }] },
      {
        nombre: "Corredores",
        distritos: [
          { nombre: "Corredor" },
          { nombre: "La Cuesta" },
          { nombre: "Canoas" },
          { nombre: "Laurel" },
        ],
      },
      {
        nombre: "Garabito",
        distritos: [{ nombre: "Jacó" }, { nombre: "Tárcoles" }],
      },
    ],
  },
  // Limón
  {
    nombre: "Limón",
    cantones: [
      {
        nombre: "Limón",
        distritos: [
          { nombre: "Limón" },
          { nombre: "Valle La Estrella" },
          { nombre: "Río Blanco" },
          { nombre: "Matama" },
        ],
      },
      {
        nombre: "Pococí",
        distritos: [
          { nombre: "Guápiles" },
          { nombre: "Jiménez" },
          { nombre: "La Rita" },
          { nombre: "Roxana" },
          { nombre: "Cariari" },
          { nombre: "Colorado" },
          { nombre: "La Colonia" },
        ],
      },
      {
        nombre: "Siquirres",
        distritos: [
          { nombre: "Siquirres" },
          { nombre: "Pacuarito" },
          { nombre: "Florida" },
          { nombre: "Germania" },
          { nombre: "Cairo" },
          { nombre: "Alegría" },
        ],
      },
      {
        nombre: "Talamanca",
        distritos: [
          { nombre: "Bratsi" },
          { nombre: "Sixaola" },
          { nombre: "Cahuita" },
          { nombre: "Telire" },
        ],
      },
      {
        nombre: "Matina",
        distritos: [
          { nombre: "Matina" },
          { nombre: "Batán" },
          { nombre: "Carrandi" },
        ],
      },
      {
        nombre: "Guácimo",
        distritos: [
          { nombre: "Guácimo" },
          { nombre: "Mercedes" },
          { nombre: "Pocora" },
          { nombre: "Río Jiménez" },
          { nombre: "Duacarí" },
        ],
      },
    ],
  },
];
