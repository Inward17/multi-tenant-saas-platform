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

    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    console.log('🗑️  Cleared existing data');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Organization 1: Acme Corp
    const acme = await prisma.organization.create({ data: { name: 'Acme Corp' } });
    console.log(`\n🏢 Created org: ${acme.name}`);

    const alice = await prisma.user.create({
        data: { email: 'alice@acme.com', password: hashedPassword, role: 'OWNER', organizationId: acme.id },
    });
    const bob = await prisma.user.create({
        data: { email: 'bob@acme.com', password: hashedPassword, role: 'ADMIN', organizationId: acme.id },
    });
    const charlie = await prisma.user.create({
        data: { email: 'charlie@acme.com', password: hashedPassword, role: 'MEMBER', organizationId: acme.id },
    });
    const diana = await prisma.user.create({
        data: { email: 'diana@acme.com', password: hashedPassword, role: 'MEMBER', organizationId: acme.id },
    });

    const webApp = await prisma.project.create({ data: { name: 'Website Redesign', organizationId: acme.id } });
    const mobileApp = await prisma.project.create({ data: { name: 'Mobile App v2', organizationId: acme.id } });
    const apiProject = await prisma.project.create({ data: { name: 'API Gateway', organizationId: acme.id } });

    await prisma.task.createMany({
        data: [
            { title: 'Design new homepage layout', description: 'Create wireframes and mockups', status: 'DONE', projectId: webApp.id, assignedTo: charlie.id, organizationId: acme.id },
            { title: 'Implement responsive header', description: 'Build header with mobile menu', status: 'IN_PROGRESS', projectId: webApp.id, assignedTo: charlie.id, organizationId: acme.id },
            { title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions', status: 'TODO', projectId: webApp.id, assignedTo: bob.id, organizationId: acme.id },
            { title: 'SEO optimization', description: 'Add meta tags and sitemap', status: 'TODO', projectId: webApp.id, assignedTo: diana.id, organizationId: acme.id },
            { title: 'Performance audit', description: 'Run Lighthouse tests', status: 'TODO', projectId: webApp.id, organizationId: acme.id },
            { title: 'Setup React Native project', description: 'Initialize with Expo', status: 'DONE', projectId: mobileApp.id, assignedTo: diana.id, organizationId: acme.id },
            { title: 'Implement auth screens', description: 'Login, register, forgot password', status: 'IN_PROGRESS', projectId: mobileApp.id, assignedTo: diana.id, organizationId: acme.id },
            { title: 'Push notification integration', description: 'Setup Firebase Cloud Messaging', status: 'TODO', projectId: mobileApp.id, assignedTo: charlie.id, organizationId: acme.id },
            { title: 'Rate limiting middleware', description: 'Implement rate limiting with Redis', status: 'IN_PROGRESS', projectId: apiProject.id, assignedTo: bob.id, organizationId: acme.id },
            { title: 'API versioning strategy', description: 'URL-based API versioning', status: 'DONE', projectId: apiProject.id, assignedTo: bob.id, organizationId: acme.id },
            { title: 'Request/response logging', description: 'Structured logging for API requests', status: 'TODO', projectId: apiProject.id, organizationId: acme.id },
        ],
    });
    console.log('   ✅ Created 11 tasks for Acme Corp');

    // Organization 2: Starter Labs
    const starter = await prisma.organization.create({ data: { name: 'Starter Labs' } });
    console.log(`\n🏢 Created org: ${starter.name}`);

    const emma = await prisma.user.create({
        data: { email: 'emma@starterlabs.com', password: hashedPassword, role: 'OWNER', organizationId: starter.id },
    });
    const frank = await prisma.user.create({
        data: { email: 'frank@starterlabs.com', password: hashedPassword, role: 'ADMIN', organizationId: starter.id },
    });
    const grace = await prisma.user.create({
        data: { email: 'grace@starterlabs.com', password: hashedPassword, role: 'MEMBER', organizationId: starter.id },
    });

    const mvp = await prisma.project.create({ data: { name: 'MVP Launch', organizationId: starter.id } });
    const marketing = await prisma.project.create({ data: { name: 'Marketing Site', organizationId: starter.id } });

    await prisma.task.createMany({
        data: [
            { title: 'User onboarding flow', description: '3-step onboarding wizard', status: 'IN_PROGRESS', projectId: mvp.id, assignedTo: grace.id, organizationId: starter.id },
            { title: 'Stripe payment integration', description: 'Stripe checkout for subscriptions', status: 'TODO', projectId: mvp.id, assignedTo: frank.id, organizationId: starter.id },
            { title: 'Email notification system', description: 'Transactional emails with SendGrid', status: 'TODO', projectId: mvp.id, assignedTo: emma.id, organizationId: starter.id },
            { title: 'Dashboard analytics', description: 'Admin dashboard with charts', status: 'TODO', projectId: mvp.id, organizationId: starter.id },
            { title: 'Design landing page', description: 'Conversion-optimized landing page', status: 'DONE', projectId: marketing.id, assignedTo: grace.id, organizationId: starter.id },
            { title: 'Write blog content', description: '5 launch blog posts for SEO', status: 'IN_PROGRESS', projectId: marketing.id, assignedTo: emma.id, organizationId: starter.id },
        ],
    });
    console.log('   ✅ Created 6 tasks for Starter Labs');

    const counts = {
        orgs: await prisma.organization.count(),
        users: await prisma.user.count(),
        projects: await prisma.project.count(),
        tasks: await prisma.task.count(),
    };
    console.log(`\n🎉 Seeding complete! Orgs: ${counts.orgs}, Users: ${counts.users}, Projects: ${counts.projects}, Tasks: ${counts.tasks}`);
    console.log('🔑 All users have password: password123');
}

main()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); await pool.end(); });
