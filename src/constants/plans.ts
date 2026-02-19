export const PLAN_DETAILS = {
    free: {
        name: 'Ücretsiz',
        userLimit: 5,
        price: 0,
        features: ['5 kullanıcıya kadar', 'Temel izin yönetimi', 'Yoklama takibi'],
        color: '#64748B',
    },
    pro: {
        name: 'Profesyonel',
        userLimit: 25,
        price: 299,
        features: ['25 kullanıcıya kadar', 'Gelişmiş raporlama', 'Masraf yönetimi', 'Belge yönetimi', 'Öncelikli destek'],
        color: '#3B82F6',
    },
    enterprise: {
        name: 'Kurumsal',
        userLimit: 999,
        price: 799,
        features: ['Sınırsız kullanıcı', 'Tüm özellikler', 'API erişimi', 'Özel entegrasyonlar', '7/24 destek'],
        color: '#8B5CF6',
    },
};

export type PlanType = keyof typeof PLAN_DETAILS;
