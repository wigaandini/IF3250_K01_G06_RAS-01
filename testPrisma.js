// Import the PrismaClient
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient();

// Test basic CRUD operations
async function testBasicOperations() {
  try {
    console.log('=== Testing Basic CRUD Operations ===');
    
    // 1. Create a user (Superadmin)
    const user = await prisma.user.create({
      data: {
        nama: 'Admin Test',
        email: `admin_test_${Date.now()}@example.com`, // Adding timestamp to ensure uniqueness
        password: 'hashedPassword123', // Should be properly hashed in production
        role: 'superadmin',
        created_at: new Date(),
        updated_at: new Date(),
        superadmin: {
          create: {
            permissions: { canManageAll: true }
          }
        }
      },
      include: {
        superadmin: true
      }
    });
    console.log('Created user:', user);
    
    // 2. Create a mustahiq
    const mustahiq = await prisma.mustahiq.create({
      data: {
        NIK: `123456789012${Date.now().toString().slice(-4)}`, // Adding timestamp to ensure uniqueness
        nama: 'Mustahiq Test',
        alamat: 'Jl. Test No. 123',
        kecamatan: 'Kec. Test',
        kabupaten: 'Kab. Test',
        provinsi: 'Provinsi Test',
        status: 'active',
        created_at: new Date(),
        created_by: user.id,
        updated_at: new Date()
      }
    });
    console.log('Created mustahiq:', mustahiq);
    
    // 3. Create a program bantuan
    const program = await prisma.program_Bantuan.create({
      data: {
        nama_program: 'Program Test',
        deskripsi: 'Program bantuan test',
        status: 'active',
        created_at: new Date(),
        created_by: user.id
      }
    });
    console.log('Created program bantuan:', program);
    
    // 4. Create a lokasi bantuan
    const lokasi = await prisma.lokasi_Bantuan.create({
      data: {
        nama_lokasi: 'Lokasi Test',
        tipe: 'komunitas',
        status: 'active',
        created_at: new Date(),
        created_by: user.id
      }
    });
    console.log('Created lokasi bantuan:', lokasi);
    
    // 5. Create bantuan
    const bantuan = await prisma.bantuan.create({
      data: {
        mustahiq_id: mustahiq.id,
        program_id: program.id,
        lokasi_id: lokasi.id,
        tanggal: new Date(),
        status: 'pending',
        created_at: new Date(),
        created_by: user.id
      }
    });
    console.log('Created bantuan:', bantuan);
    
    // 6. Query all mustahiqs
    const allMustahiqs = await prisma.mustahiq.findMany({
      include: {
        bantuans: true
      }
    });
    console.log(`Found ${allMustahiqs.length} mustahiqs`);
    
    // 7. Update mustahiq
    const updatedMustahiq = await prisma.mustahiq.update({
      where: { id: mustahiq.id },
      data: {
        nama: 'Mustahiq Updated',
        updated_at: new Date()
      }
    });
    console.log('Updated mustahiq:', updatedMustahiq);
    
    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Error in tests:', error);
  } finally {
    // Disconnect from the database
    await prisma.$disconnect();
  }
}

// Run the tests
testBasicOperations();