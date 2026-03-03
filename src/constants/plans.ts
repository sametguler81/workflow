export const PLAN_DETAILS = {
    free: {
        name: 'Başlangıç',
        tag: 'FREE',
        userLimit: 5,
        storageLimit: 5 * 1024 * 1024 * 1024, // 5GB in bytes
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: ['5 kullanıcıya kadar', '5 GB Depolama', 'Temel izin yönetimi', 'Yoklama takibi'],
        color: '#64748B',
    },
    pro: {
        name: 'Profesyonel',
        tag: 'PRO',
        userLimit: 25,
        storageLimit: 20 * 1024 * 1024 * 1024, // 20GB in bytes
        monthlyPrice: 499,
        yearlyPrice: 4499,
        features: ['25 kullanıcıya kadar', '20 GB Depolama', 'Gelişmiş raporlama', 'Masraf yönetimi', 'Belge yönetimi', 'Öncelikli destek'],
        color: '#1E40AF',
    },
    enterprise: {
        name: 'Kurumsal',
        tag: 'ENTERPRISE',
        userLimit: 999,
        storageLimit: -1, // Unlimited
        monthlyPrice: 999,
        yearlyPrice: 8999,
        features: ['Sınırsız kullanıcı', 'Sınırsız Depolama', 'Tüm özellikler', 'API erişimi', 'Özel entegrasyonlar', '7/24 destek'],
        color: '#7C3AED',
    },
};

export type PlanType = keyof typeof PLAN_DETAILS;
