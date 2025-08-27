import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '@/models';
import { Service } from '@/models';
import { ServiceProvider } from '@/models';
import { Booking } from '@/models';
import { Review } from '@/models';
import { Notification } from '@/models';
import { connectDB } from '@/config/database';

// Sample data for seeding
const sampleUsers = [
  {
    name: 'John Customer',
    email: 'customer@example.com',
    phone: '9876543210',
    password: 'password123',
    role: 'customer',
    isVerified,
    isActive,
    addresses: [
      {
        type: 'home',
        street: '123 Main Street',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        landmark: 'Near City Mall',
        coordinates: [75.8577, 22.7196]
      }
    ],
    preferences: {
      language: 'en',
      currency: 'INR',
      emailNotifications,
      smsNotifications,
      pushNotifications
    }
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '9876543211',
    password: 'password123',
    role: 'customer',
    isVerified,
    isActive,
    addresses: [
      {
        type: 'home',
        street: '456 Park Avenue',
        city: 'Bhopal',
        state: 'Madhya Pradesh',
        pincode: '462001',
        coordinates: [77.4126, 23.2599]
      }
    ]
  },
  {
    name: 'Admin User',
    email: 'admin@deshisahayak.com',
    phone: '9876543212',
    password: 'admin123',
    role: 'admin',
    isVerified,
    isActive
  }
];

const sampleProviders = [
  {
    name: 'Rajesh Sharma',
    email: 'rajesh@example.com',
    phone: '9876543213',
    password: 'provider123',
    bio: 'Experienced home cleaning professional with 5+ years of expertise',
    experience,
    services: ['Home Cleaning', 'Deep Cleaning', 'Kitchen Cleaning'],
    certifications: ['Professional Cleaning Certificate'],
    address: {
      type: 'work',
      street: '789 Service Street',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452002',
      coordinates: [75.8577, 22.7196]
    },
    isVerified,
    isActive,
    rating: { average.5, count },
    availability: {
      weeklySchedule: {
        monday: { isAvailable, timeSlots: ['09-12', '14-17'] },
        tuesday: { isAvailable, timeSlots: ['09-12', '14-17'] },
        wednesday: { isAvailable, timeSlots: ['09-12', '14-17'] },
        thursday: { isAvailable, timeSlots: ['09-12', '14-17'] },
        friday: { isAvailable, timeSlots: ['09-12', '14-17'] },
        saturday: { isAvailable, timeSlots: ['09-12'] },
        sunday: { isAvailable, timeSlots: [] }
      },
      isActive
    },
    settings: {
      autoAcceptBookings,
      serviceRadius,
      notifications: {
        email,
        sms,
        push
      }
    },
    totalBookings,
    completedBookings,
    avgRating.5
  },
  {
    name: 'Amit Kumar',
    email: 'amit@example.com',
    phone: '9876543214',
    password: 'provider123',
    bio: 'Professional electrician with expertise in home and commercial electrical work',
    experience,
    services: ['Electrical Repair', 'Wiring', 'Appliance Installation'],
    certifications: ['Electrical Safety Certificate', 'Licensed Electrician'],
    address: {
      type: 'work',
      street: '321 Electric Lane',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452003',
      coordinates: [75.8577, 22.7196]
    },
    isVerified,
    isActive,
    rating: { average.8, count },
    totalBookings,
    completedBookings
  },
  {
    name: 'Priya Patel',
    email: 'priya@example.com',
    phone: '9876543215',
    password: 'provider123',
    bio: 'Professional beautician offering salon services at home',
    experience,
    services: ['Hair Cut', 'Facial', 'Manicure', 'Pedicure'],
    certifications: ['Beauty Therapy Certificate'],
    address: {
      type: 'work',
      street: '654 Beauty Street',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462002',
      coordinates: [77.4126, 23.2599]
    },
    isVerified,
    isActive,
    rating: { average.6, count },
    totalBookings,
    completedBookings
  }
];

const sampleServices = [
  {
    name: 'Home Deep Cleaning',
    description: 'Comprehensive deep cleaning service for your entire home including kitchen, bathrooms, bedrooms, and living areas',
    category: 'Home Services',
    subcategory: 'Cleaning',
    price,
    duration, // 4 hours
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
      'https://images.unsplash.com/photo-1563453392212-326f5e854473'
    ],
    tags: ['deep cleaning', 'home cleaning', 'sanitization', 'professional'],
    isActive,
    rating: { average.5, count },
    popularity,
    bookingCount
  },
  {
    name: 'Kitchen Cleaning',
    description: 'Specialized kitchen cleaning including chimney, appliances, and deep sanitization',
    category: 'Home Services',
    subcategory: 'Cleaning',
    price,
    duration, // 2 hours
    images: [
      'https://images.unsplash.com/photo-1556909114-4c3c5d82bc0a'
    ],
    tags: ['kitchen', 'appliances', 'sanitization'],
    isActive,
    rating: { average.3, count },
    popularity,
    bookingCount
  },
  {
    name: 'Electrical Repair',
    description: 'Professional electrical repair services for switches, outlets, wiring issues, and electrical appliances',
    category: 'Home Services',
    subcategory: 'Electrical',
    price,
    duration, // 1 hour
    images: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4'
    ],
    tags: ['electrical', 'repair', 'wiring', 'switches'],
    isActive,
    rating: { average.8, count },
    popularity,
    bookingCount
  },
  {
    name: 'Hair Cut & Styling',
    description: 'Professional hair cutting and styling services at the comfort of your home',
    category: 'Beauty & Wellness',
    subcategory: 'Hair Care',
    price,
    duration, // 1.5 hours
    images: [
      'https://images.unsplash.com/photo-1560869713-7d0954d87cd4'
    ],
    tags: ['haircut', 'styling', 'beauty', 'salon at home'],
    isActive,
    rating: { average.6, count },
    popularity,
    bookingCount
  },
  {
    name: 'Plumbing Service',
    description: 'Complete plumbing solutions including pipe repair, tap installation, and drain cleaning',
    category: 'Home Services',
    subcategory: 'Plumbing',
    price,
    duration,
    images: [
      'https://images.unsplash.com/photo-1558618666-fdcd55609ebb'
    ],
    tags: ['plumbing', 'pipes', 'repair', 'installation'],
    isActive,
    rating: { average.4, count },
    popularity,
    bookingCount
  },
  {
    name: 'AC Service & Repair',
    description: 'Air conditioner servicing, cleaning, gas refilling, and repair services',
    category: 'Home Services',
    subcategory: 'Appliance Repair',
    price,
    duration,
    images: [
      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189'
    ],
    tags: ['ac repair', 'air conditioner', 'servicing', 'gas refill'],
    isActive,
    rating: { average.7, count },
    popularity,
    bookingCount
  }
];

const sampleBookings = [
  {
    scheduledDate Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    status: 'confirmed',
    address: {
      type: 'home',
      street: '123 Main Street',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      coordinates: [75.8577, 22.7196]
    },
    serviceAmount,
    platformFee,
    gstAmount,
    totalAmount,
    specialInstructions: 'Please bring eco-friendly cleaning products',
    payment: {
      method: 'razorpay',
      status: 'completed',
      transactionId: 'txn_sample123',
      paidAt Date()
    }
  },
  {
    scheduledDate Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    status: 'completed',
    address: {
      type: 'home',
      street: '456 Park Avenue',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462001',
      coordinates: [77.4126, 23.2599]
    },
    serviceAmount,
    platformFee,
    gstAmount,
    totalAmount,
    payment: {
      method: 'razorpay',
      status: 'completed',
      transactionId: 'txn_sample456',
      paidAt Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    workSummary: {
      workDescription: 'Fixed electrical switch and outlet in living room',
      completedAt Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  }
];

const sampleReviews = [
  {
    rating,
    comment: 'Excellent service! Very professional and thorough cleaning. Highly recommended.',
    images: [],
    status: 'active'
  },
  {
    rating,
    comment: 'Good electrical work. Quick and efficient. Will book again.',
    images: [],
    status: 'active'
  }
];

const sampleNotifications = [
  {
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your home cleaning service has been confirmed for tomorrow.',
    priority: 'normal',
    channels: ['in_app', 'email'],
    status: 'delivered',
    deliveredAt Date()
  },
  {
    type: 'system',
    title: 'Welcome to Deshi Sahayak Hub!',
    message: 'Thank you for joining our platform. Explore services in your area.',
    priority: 'normal',
    channels: ['in_app', 'email'],
    status: 'delivered',
    deliveredAt Date()
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      ServiceProvider.deleteMany({}),
      Service.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Hash passwords for users and providers
    const hashPassword = async (password) => {
      return await bcrypt.hash(password, 12);
    };

    // Create users
    const users = await Promise.all(
      (sampleUsers as any[]).map(async (userData) => {
        const hashedPassword = await hashPassword(userData.password);
        return User.create({ ...userData, password });
      })
    );
    console.log(`Created ${users.length} users`);

    // Create service providers
    const providers = await Promise.all(
      (sampleProviders as any[]).map(async (providerData) => {
        const hashedPassword = await hashPassword(providerData.password);
        return ServiceProvider.create({ ...providerData, password });
      })
    );
    console.log(`Created ${providers.length} service providers`);

    // Create services and assign to providers
    const services = await Promise.all(
      (sampleServices as any[]).map(async (serviceData, index) => {
        const provider = providers[index % providers.length];
        return Service.create({ ...serviceData, provider._id });
      })
    );
    console.log(`Created ${services.length} services`);

    // Create bookings
    const bookings = await Promise.all(
      (sampleBookings as any[]).map(async (bookingData, index) => {
        const customer = users[index]; // Use first two users as customers
        const service = services[index];
        const provider = providers[index];
        
        return Booking.create({
          ...bookingData,
          customer._id,
          service._id,
          provider._id
        });
      })
    );
    console.log(`Created ${bookings.length} bookings`);

    // Create reviews for completed bookings
    const reviews = await Promise.all(
      (sampleReviews as any[]).map(async (reviewData, index) => {
        const booking = bookings[index + 1]; // Use completed booking
        if (booking && booking.status === 'completed') {
          return Review.create({
            ...reviewData,
            customer.customer,
            service.service,
            provider.provider,
            booking._id
          });
        }
        return null;
      })
    );
    const validReviews = reviews.filter(Boolean);
    console.log(`Created ${validReviews.length} reviews`);

    // Create notifications for users
    const notifications = await Promise.all(
      (sampleNotifications as any[]).map(async (notificationData, index) => {
        const user = users[index % users.length];
        return Notification.create({
          ...notificationData,
          recipient._id
        });
      })
    );
    console.log(`Created ${notifications.length} notifications`);

    // Update user preferences for providers
    await Promise.all(
      (providers as any[]).map(async (provider) => {
        await ServiceProvider.findByIdAndUpdate(provider._id, {
          preferences: {
            language: 'en',
            currency: 'INR',
            emailNotifications,
            smsNotifications,
            pushNotifications
          }
        });
      })
    );

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSample accounts created:');
    console.log('👤 Customer@example.com / password123');
    console.log('👤 Customer@example.com / password123');
    console.log('🔧 Provider@example.com / provider123');
    console.log('🔧 Provider@example.com / provider123');
    console.log('🔧 Provider@example.com / provider123');
    console.log('👑 Admin@deshisahayak.com / admin123');

    console.log('\n📊 Summary:');
    console.log(`- ${users.length} users created`);
    console.log(`- ${providers.length} service providers created`);
    console.log(`- ${services.length} services created`);
    console.log(`- ${bookings.length} bookings created`);
    console.log(`- ${validReviews.length} reviews created`);
    console.log(`- ${notifications.length} notifications created`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Function to clear database
async function clearDatabase() {
  try {
    await connectDB();
    console.log('Connected to database');

    await Promise.all([
      User.deleteMany({}),
      ServiceProvider.deleteMany({}),
      Service.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('🧹 Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'clear') {
    clearDatabase().then(() => process.exit(0));
  } else {
    seedDatabase().then(() => process.exit(0));
  }
}

export { seedDatabase, clearDatabase };
