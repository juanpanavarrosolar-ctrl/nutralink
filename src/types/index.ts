export type UserRole = 'nutricionista' | 'paciente' | 'admin'

export interface Nutricionista {
  id: string
  nombre: string
  email: string
  rut: string
  telefono?: string
  createdAt: Date
}

export interface Producto {
  id: string
  nombre: string
  descripcion: string
  marca: string
  precio: number
  stock: number
  imagen?: string
  activo: boolean
}

export interface ItemProtocolo {
  productoId: string
  producto?: Producto
  cantidad: number
  frecuencia: string
  nota?: string
}

export interface Protocolo {
  id: string
  nutricionistaId: string
  nutricionista?: Nutricionista
  nombrePaciente: string
  emailPaciente?: string
  token: string
  items: ItemProtocolo[]
  activo: boolean
  createdAt: Date
  expiraAt?: Date
}

export interface Orden {
  id: string
  protocoloId: string
  protocolo?: Protocolo
  nombrePaciente: string
  emailPaciente: string
  direccion: string
  total: number
  comisionNutricionista: number
  estado: 'pendiente' | 'pagada' | 'enviada' | 'entregada' | 'cancelada'
  recompraActiva: boolean
  flowToken?: string
  createdAt: Date
}
