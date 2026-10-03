export const openapi = {
  openapi: '3.0.3',
  info: { title: 'Hope-Care API', version: '1.0.0' },
  tags: [
    { name: 'Auth', description: 'Authentication and Registration' },
    { name: 'Patient - Appointments', description: 'Appointments for Patients' },
    { name: 'Doctor - Appointments', description: 'Appointments for Doctors' },
    { name: 'Hospitals & Departments', description: 'Hospital management' },
    { name: 'Patient - Profile & History', description: 'Patient records' },
    { name: 'Patient - Addresses', description: 'Address management for patients' },
    { name: 'Documents', description: 'Document management' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterInput: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
          role: { type: 'string', enum: ['patient', 'doctor'] },
          name: { type: 'string' },
        },
        required: ['email', 'password', 'role', 'name'],
      },
      LoginInput: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
        required: ['email', 'password'],
      },
      AppointmentInput: {
        type: 'object',
        properties: {
          doctorId: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          reason: { type: 'string' },
        },
        required: ['doctorId', 'date'],
      },
      HospitalInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: { type: 'string' },
          contact: { type: 'string' },
        },
      },
      AddressInput: {
        type: 'object',
        properties: {
          line1: { type: 'string' },
          line2: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          country: { type: 'string' },
          zipCode: { type: 'string' },
          isPermanent: { type: 'boolean' },
        },
      }
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: { '200': { description: 'Authenticated' } },
      },
    },
    '/api/v1/departments': {
      get: {
        tags: ['Hospitals & Departments'],
        summary: 'List departments',
        responses: { '200': { description: 'Departments' } },
      },
      post: {
        tags: ['Hospitals & Departments'],
        summary: 'Create a department',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/v1/hospitals': {
      get: {
        tags: ['Hospitals & Departments'],
        summary: 'List hospitals with address details and departments',
        responses: { '200': { description: 'Hospitals with aggregated departments' } },
      },
      post: {
        tags: ['Hospitals & Departments'],
        summary: 'Create a hospital with structured address/contact details',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/HospitalInput' } } },
        },
        responses: { '201': { description: 'Hospital created' } },
      },
    },
    '/api/v1/patients/me/medical-history': {
      get: {
        tags: ['Patient - Profile & History'],
        summary: 'Get patient medical history',
        responses: { '200': { description: 'Medical history' } },
      },
      post: {
        tags: ['Patient - Profile & History'],
        summary: 'Add to patient medical history',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { condition: { type: 'string' }, details: { type: 'string' } } } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/v1/patient/appointments': {
      get: {
        tags: ['Patient - Appointments'],
        summary: 'List patient appointments',
        responses: { '200': { description: 'Appointments list' } },
      },
      post: {
        tags: ['Patient - Appointments'],
        summary: 'Book a new appointment (Patient)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AppointmentInput' } } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/v1/doctor/appointments': {
      get: {
        tags: ['Doctor - Appointments'],
        summary: 'List doctor appointments',
        responses: { '200': { description: 'Appointments list' } },
      },
    },
    '/api/v1/appointments/{id}/route': {
      post: {
        tags: ['Doctor - Appointments'],
        summary: 'Route appointment to another doctor',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { newDoctorId: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Routed' } },
      },
    },
    '/api/v1/appointments/{id}/status': {
      patch: {
        tags: ['Doctor - Appointments', 'Patient - Appointments'],
        summary: 'Update appointment status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['confirmed', 'cancelled', 'completed'] } } } } },
        },
        responses: { '200': { description: 'Status changed' } },
      },
    },
    '/api/v1/documents/upload': {
      post: {
        tags: ['Documents'],
        summary: 'Upload a private document',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' }, documentType: { type: 'string' } },
              },
            },
          },
        },
        responses: { '201': { description: 'Temporary document created' } },
      },
    },
    '/api/v1/documents/{documentId}': {
      get: {
        tags: ['Documents'],
        summary: 'Get Document Metadata',
        parameters: [{ name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Document metadata' } },
      },
      delete: {
        tags: ['Documents'],
        summary: 'Delete Document',
        parameters: [{ name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Deleted' } },
      },
    },
    '/api/v1/documents/{documentId}/url': {
      get: {
        tags: ['Documents'],
        summary: 'Get Document URL',
        parameters: [{ name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Short-lived signed URL' } },
      },
    },
    '/api/v1/patients/me/addresses': {
      get: {
        tags: ['Patient - Addresses'],
        summary: 'Get Active current and permanent addresses',
        responses: { '200': { description: 'Active current and permanent addresses' } },
      },
      post: {
        tags: ['Patient - Addresses'],
        summary: 'Create new address',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddressInput' } } },
        },
        responses: { '201': { description: 'Versioned address created' } },
      },
    },
    '/api/v1/patients/me/addresses/history': {
      get: {
        tags: ['Patient - Addresses'],
        summary: 'Get address history',
        responses: { '200': { description: 'Address versions' } },
      },
    },
    '/api/v1/patients/me/addresses/{addressId}': {
      get: {
        tags: ['Patient - Addresses'],
        summary: 'Get specific address',
        parameters: [{ name: 'addressId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Address' } },
      },
      put: {
        tags: ['Patient - Addresses'],
        summary: 'Update address',
        parameters: [{ name: 'addressId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddressInput' } } },
        },
        responses: { '201': { description: 'New address version' } },
      },
    },
    '/api/v1/patients/me/addresses/{addressId}/status-history': {
      get: {
        tags: ['Patient - Addresses'],
        summary: 'Get status history of address',
        parameters: [{ name: 'addressId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Status history' } },
      },
    },
    '/api/v1/patients/me/profile': {
      put: {
        tags: ['Patient - Profile & History'],
        summary: 'Update profile',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { profilePhotoUrl: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Profile photo attached' } },
      },
    },
  }
};
