import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...\n');

    // Clear existing data
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    console.log('🗑️  Cleared existing data');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // ─────────────────────────────────────────
    // Organization 1: Acme Corp (Tech Company)
    // ─────────────────────────────────────────
    const acme = await prisma.organization.create({
        data: { name: 'Acme Corp' },
    });
    console.log(`\n🏢 Created org: ${acme.name}`);

    const alice = await prisma.user.create({
        data: {
            email: 'alice@acme.com',
            password: hashedPassword,
            role: 'OWNER',
            organizationId: acme.id,
        },
    });

    const bob = await prisma.user.create({
        data: {
            email: 'bob@acme.com',
            password: hashedPassword,
            role: 'ADMIN',
            organizationId: acme.id,
        },
    });

    const charlie = await prisma.user.create({
        data: {
            email: 'charlie@acme.com',
            password: hashedPassword,
            role: 'MEMBER',
            organizationId: acme.id,
        },
    });

    const diana = await prisma.user.create({
        data: {
            email: 'diana@acme.com',
            password: hashedPassword,
            role: 'MEMBER',
            organizationId: acme.id,
        },
    });

    console.log('   👤 alice@acme.com (OWNER)');
    console.log('   👤 bob@acme.com (ADMIN)');
    console.log('   👤 charlie@acme.com (MEMBER)');
    console.log('   👤 diana@acme.com (MEMBER)');

    // Acme Projects
    const webApp = await prisma.project.create({
        data: { name: 'Website Redesign', organizationId: acme.id },
    });
    const mobileApp = await prisma.project.create({
        data: { name: 'Mobile App v2', organizationId: acme.id },
    });
    const apiProject = await prisma.project.create({
        data: { name: 'API Gateway', organizationId: acme.id },
    });
    console.log('   📁 Projects: Website Redesign, Mobile App v2, API Gateway');

    // Acme Tasks — Website Redesign
    await prisma.task.createMany({
        data: [
            {
                title: 'Design new homepage layout',
                description: 'Create wireframes and mockups for the new homepage following brand guidelines',
                status: 'DONE',
                projectId: webApp.id,
                assignedTo: charlie.id,
                organizationId: acme.id,
            },
            {
                title: 'Implement responsive header',
                description: 'Build the header component with mobile hamburger menu',
                status: 'IN_PROGRESS',
                projectId: webApp.id,
                assignedTo: charlie.id,
                organizationId: acme.id,
            },
            {
                title: 'Setup CI/CD pipeline',
                description: 'Configure GitHub Actions for auto-deployment to staging',
                status: 'TODO',
                projectId: webApp.id,
                assignedTo: bob.id,
                organizationId: acme.id,
            },
            {
                title: 'SEO optimization',
                description: 'Add meta tags, sitemap, and structured data',
                status: 'TODO',
                projectId: webApp.id,
                assignedTo: diana.id,
                organizationId: acme.id,
            },
            {
                title: 'Performance audit',
                description: 'Run Lighthouse tests and fix performance bottlenecks',
                status: 'TODO',
                projectId: webApp.id,
                organizationId: acme.id,
            },
        ],
    });

    // Acme Tasks — Mobile App
    await prisma.task.createMany({
        data: [
            {
                title: 'Setup React Native project',
                description: 'Initialize project with Expo and configure navigation',
                status: 'DONE',
                projectId: mobileApp.id,
                assignedTo: diana.id,
                organizationId: acme.id,
            },
            {
                title: 'Implement authentication screens',
                description: 'Login, register, and forgot password screens',
                status: 'IN_PROGRESS',
                projectId: mobileApp.id,
                assignedTo: diana.id,
                organizationId: acme.id,
            },
            {
                title: 'Push notification integration',
                description: 'Setup Firebase Cloud Messaging for push notifications',
                status: 'TODO',
                projectId: mobileApp.id,
                assignedTo: charlie.id,
                organizationId: acme.id,
            },
            {
                title: 'Offline mode support',
                description: 'Implement local storage sync with AsyncStorage',
                status: 'TODO',
                projectId: mobileApp.id,
                organizationId: acme.id,
            },
        ],
    });

    // Acme Tasks — API Gateway
    await prisma.task.createMany({
        data: [
            {
                title: 'Rate limiting middleware',
                description: 'Implement rate limiting per API key with Redis',
                status: 'IN_PROGRESS',
                projectId: apiProject.id,
                assignedTo: bob.id,
                organizationId: acme.id,
            },
            {
                title: 'API versioning strategy',
                description: 'Design and implement URL-based API versioning',
                status: 'DONE',
                projectId: apiProject.id,
                assignedTo: bob.id,
                organizationId: acme.id,
            },
            {
                title: 'Request/response logging',
                description: 'Add structured logging for all API requests',
                status: 'TODO',
                projectId: apiProject.id,
                organizationId: acme.id,
            },
        ],
    });

    console.log('   ✅ Created 12 tasks');

    // ────────────────────────────────────────────
    // Organization 2: Starter Labs (Small Startup)
    // ────────────────────────────────────────────
    const starter = await prisma.organization.create({
        data: { name: 'Starter Labs' },
    });
    console.log(`\n🏢 Created org: ${starter.name}`);

    const emma = await prisma.user.create({
        data: {
            email: 'emma@starterlabs.com',
            password: hashedPassword,
            role: 'OWNER',
            organizationId: starter.id,
        },
    });

    const frank = await prisma.user.create({
        data: {
            email: 'frank@starterlabs.com',
            password: hashedPassword,
            role: 'ADMIN',
            organizationId: starter.id,
        },
    });

    const grace = await prisma.user.create({
        data: {
            email: 'grace@starterlabs.com',
            password: hashedPassword,
            role: 'MEMBER',
            organizationId: starter.id,
        },
    });

    console.log('   👤 emma@starterlabs.com (OWNER)');
    console.log('   👤 frank@starterlabs.com (ADMIN)');
    console.log('   👤 grace@starterlabs.com (MEMBER)');

    // Starter Labs Projects
    const mvp = await prisma.project.create({
        data: { name: 'MVP Launch', organizationId: starter.id },
    });
    const marketing = await prisma.project.create({
        data: { name: 'Marketing Site', organizationId: starter.id },
    });
    console.log('   📁 Projects: MVP Launch, Marketing Site');

    // Starter Labs Tasks
    await prisma.task.createMany({
        data: [
            {
                title: 'User onboarding flow',
                description: 'Build the 3-step onboarding wizard for new users',
                status: 'IN_PROGRESS',
                projectId: mvp.id,
                assignedTo: grace.id,
                organizationId: starter.id,
            },
            {
                title: 'Stripe payment integration',
                description: 'Integrate Stripe checkout for subscription plans',
                status: 'TODO',
                projectId: mvp.id,
                assignedTo: frank.id,
                organizationId: starter.id,
            },
            {
                title: 'Email notification system',
                description: 'Setup transactional emails with SendGrid',
                status: 'TODO',
                projectId: mvp.id,
                assignedTo: emma.id,
                organizationId: starter.id,
            },
            {
                title: 'Dashboard analytics',
                description: 'Build admin dashboard with charts and KPIs',
                status: 'TODO',
                projectId: mvp.id,
                organizationId: starter.id,
            },
            {
                title: 'Design landing page',
                description: 'Create a conversion-optimized landing page',
                status: 'DONE',
                projectId: marketing.id,
                assignedTo: grace.id,
                organizationId: starter.id,
            },
            {
                title: 'Write blog content',
                description: 'Create 5 launch blog posts for SEO',
                status: 'IN_PROGRESS',
                projectId: marketing.id,
                assignedTo: emma.id,
                organizationId: starter.id,
            },
        ],
    });

    console.log('   ✅ Created 6 tasks');

    // ──────────────────────
    // Summary
    // ──────────────────────
    const orgCount = await prisma.organization.count();
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const taskCount = await prisma.task.count();

    console.log('\n────────────────────────────');
    console.log('🎉 Seeding complete!');
    console.log(`   Organizations: ${orgCount}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Tasks: ${taskCount}`);
    console.log('────────────────────────────');
    console.log('\n🔑 All users have password: password123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
