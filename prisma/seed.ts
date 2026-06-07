import { PrismaClient, CategoriaProducto } from '@prisma/client'

const prisma = new PrismaClient()

const productos = [
  {
    nombre: 'Omega 3 Fish Oil 1000mg',
    descripcion:
      'Ácidos grasos esenciales EPA y DHA de alta pureza para salud cardiovascular y función cognitiva.',
    marca: 'Nordic Naturals',
    categoria: CategoriaProducto.OMEGA,
    precio_costo: 18900,
    precio_venta: 32900,
    stock: 120,
    imagen_url: null,
  },
  {
    nombre: 'Magnesio Glicinato 400mg',
    descripcion:
      'Forma quelada de alta biodisponibilidad. Apoya la relajación muscular, calidad del sueño y función nerviosa.',
    marca: 'Jarrow Formulas',
    categoria: CategoriaProducto.MINERALES,
    precio_costo: 14200,
    precio_venta: 24900,
    stock: 85,
    imagen_url: null,
  },
  {
    nombre: 'Vitamina D3 2000 UI',
    descripcion:
      'Colecalciferol en aceite de oliva para máxima absorción. Esencial para huesos, sistema inmune y ánimo.',
    marca: 'Solgar',
    categoria: CategoriaProducto.VITAMINAS,
    precio_costo: 9800,
    precio_venta: 16900,
    stock: 200,
    imagen_url: null,
  },
  {
    nombre: 'Zinc Quelado 25mg',
    descripcion:
      'Zinc bisglicinato de alta absorción. Apoya el sistema inmune, la piel y la función reproductiva.',
    marca: 'Thorne',
    categoria: CategoriaProducto.MINERALES,
    precio_costo: 11500,
    precio_venta: 19900,
    stock: 95,
    imagen_url: null,
  },
  {
    nombre: 'Hierro Quelado 25mg',
    descripcion:
      'Hierro bisglicinato gentil con el estómago. No estreñe. Para anemia ferropénica y fatiga.',
    marca: 'Solgar',
    categoria: CategoriaProducto.MINERALES,
    precio_costo: 13100,
    precio_venta: 22900,
    stock: 70,
    imagen_url: null,
  },
  {
    nombre: 'Vitamina C 1000mg con Bioflavonoides',
    descripcion:
      'Ácido ascórbico con bioflavonoides cítricos para potenciar absorción. Antioxidante e inmunoestimulante.',
    marca: 'NOW Foods',
    categoria: CategoriaProducto.VITAMINAS,
    precio_costo: 8900,
    precio_venta: 15900,
    stock: 150,
    imagen_url: null,
  },
  {
    nombre: 'Probiótico Multicepa 50 Billones UFC',
    descripcion:
      '12 cepas probióticas seleccionadas para equilibrio de microbiota intestinal, digestión e inmunidad.',
    marca: 'Garden of Life',
    categoria: CategoriaProducto.PROBIOTICOS,
    precio_costo: 22400,
    precio_venta: 38900,
    stock: 60,
    imagen_url: null,
  },
  {
    nombre: 'B Complex Metilado',
    descripcion:
      'Complejo B con formas metiladas activas (metilfolato, metilcobalamina). Energía celular y sistema nervioso.',
    marca: 'Thorne',
    categoria: CategoriaProducto.VITAMINAS,
    precio_costo: 17300,
    precio_venta: 29900,
    stock: 80,
    imagen_url: null,
  },
  {
    nombre: 'Colágeno Hidrolizado Tipo I y III',
    descripcion:
      'Péptidos de colágeno bovino de pasto. Apoya articulaciones, piel, cabello y uñas. Fácil disolución.',
    marca: 'Great Lakes Wellness',
    categoria: CategoriaProducto.OTRO,
    precio_costo: 16800,
    precio_venta: 28900,
    stock: 100,
    imagen_url: null,
  },
  {
    nombre: 'Coenzima Q10 200mg',
    descripcion:
      'Ubiquinona en cápsula softgel para máxima absorción. Energía mitocondrial y salud cardiovascular.',
    marca: 'Jarrow Formulas',
    categoria: CategoriaProducto.OTRO,
    precio_costo: 20100,
    precio_venta: 34900,
    stock: 55,
    imagen_url: null,
  },
]

async function main() {
  console.log('🌱 Iniciando seed de productos...')

  for (const producto of productos) {
    const result = await prisma.producto.upsert({
      where: { nombre: producto.nombre },
      update: producto,
      create: producto,
    })
    console.log(`  ✓ ${result.nombre}`)
  }

  console.log(`\n✅ ${productos.length} productos sembrados correctamente.`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
