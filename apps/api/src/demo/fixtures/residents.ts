/**
 * Demo Fixture — Residents
 *
 * Generates 116 unique residents with Mexican names assigned to
 * apartments in Tower RIN (A) and Tower DANUBIO (B).
 *
 *   Tower DANUBIO (B): floors 01–14 × 4 units + floor 15 × 2 = 58
 *   Tower RIN    (A): floors 01–14 × 4 units + floor 15 × 2 = 58
 *   Total: 116
 */

const FIRST_NAMES_M = [
  'Carlos', 'Juan', 'Miguel', 'José', 'Luis', 'Francisco', 'Antonio',
  'Pedro', 'Manuel', 'Rafael', 'Fernando', 'Roberto', 'Ricardo', 'Alberto',
  'Eduardo', 'Alejandro', 'Sergio', 'Javier', 'Daniel', 'Arturo',
  'Enrique', 'Óscar', 'Raúl', 'Héctor', 'Jorge', 'Guillermo', 'Adrián',
  'Pablo', 'Andrés', 'Diego', 'Iván', 'Gustavo', 'Hugo', 'Ramón',
  'Salvador', 'Gabriel', 'Mauricio', 'Ernesto', 'Víctor', 'Tomás',
  'Emilio', 'Ignacio', 'Rodrigo', 'César', 'Felipe', 'Ángel', 'Rubén',
  'Armando', 'Gerardo', 'Omar', 'David', 'Saúl', 'Ismael', 'Alfredo',
  'Martín', 'Benito', 'Lorenzo', 'Nicolás',
]

const FIRST_NAMES_F = [
  'María', 'Ana', 'Carmen', 'Laura', 'Patricia', 'Guadalupe', 'Rosa',
  'Sofía', 'Andrea', 'Fernanda', 'Claudia', 'Verónica', 'Sandra',
  'Teresa', 'Mónica', 'Elena', 'Lucía', 'Gabriela', 'Cecilia', 'Silvia',
  'Martha', 'Gloria', 'Leticia', 'Alicia', 'Daniela', 'Valeria',
  'Isabella', 'Mariana', 'Paulina', 'Ximena', 'Alejandra', 'Beatriz',
  'Catalina', 'Diana', 'Estela', 'Fabiola', 'Griselda', 'Irma',
  'Josefina', 'Karla', 'Lourdes', 'Nadia', 'Olivia', 'Pilar',
  'Rebeca', 'Susana', 'Verónica', 'Yolanda', 'Angélica', 'Brenda',
  'Consuelo', 'Dolores', 'Esperanza', 'Francisca', 'Graciela',
  'Hortensia', 'Ivonne', 'Julia',
]

const SURNAMES = [
  'García', 'Hernández', 'López', 'Martínez', 'González', 'Rodríguez',
  'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera',
  'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez',
  'Ortiz', 'Ramos', 'Jiménez', 'Mendoza', 'Ruiz', 'Aguilar',
  'Castillo', 'Vargas', 'Romero', 'Herrera', 'Medina', 'Castro',
  'Núñez', 'Vega', 'Delgado', 'Guerrero', 'Contreras', 'Estrada',
  'Ávila', 'Salazar', 'Fuentes', 'Campos', 'Cervantes', 'Rojas',
  'Acosta', 'Navarro', 'Molina', 'Ibarra', 'Soto', 'Lara',
  'Bautista', 'Cabrera', 'Luna', 'Domínguez', 'Suárez', 'Montes',
  'Orozco', 'Valencia', 'Ponce', 'Figueroa',
]

export interface DemoResident {
  name: string
  apartment: string
  tower: string
  email: string
}

export function generateResidents(): DemoResident[] {
  const residents: DemoResident[] = []

  const towers = [
    { prefix: 'B', name: 'DANUBIO' },
    { prefix: 'A', name: 'RIN' },
  ]

  let nameIdx = 0

  for (const tower of towers) {
    for (let floor = 1; floor <= 15; floor++) {
      const unitsOnFloor = floor === 15 ? 2 : 4
      for (let unit = 1; unit <= unitsOnFloor; unit++) {
        const apt = `${tower.prefix}${String(floor).padStart(2, '0')}${String(unit).padStart(2, '0')}`

        const isMale = nameIdx % 2 === 0
        const namePool = isMale ? FIRST_NAMES_M : FIRST_NAMES_F
        const firstName = namePool[Math.floor(nameIdx / 2) % namePool.length]
        const surname = SURNAMES[nameIdx % SURNAMES.length]

        residents.push({
          name: `${firstName} ${surname}`,
          apartment: apt,
          tower: tower.name,
          email: `${apt}@gmail.com`,
        })
        nameIdx++
      }
    }
  }

  return residents
}
