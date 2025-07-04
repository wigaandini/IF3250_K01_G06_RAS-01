export const statusPernikahanOptions = [
    { value: 'belum_menikah', label: 'Belum Menikah' },
    { value: 'menikah', label: 'Menikah' },
    { value: 'cerai_hidup', label: 'Cerai Hidup' },
    { value: 'cerai_mati', label: 'Cerai Mati' },
  ];
  
  export const jenisKelaminOptions = [
    { value: 'laki-laki', label: 'Laki-laki' },
    { value: 'perempuan', label: 'Perempuan' },
  ];
  
  export const agamaOptions = [
    { value: 'islam', label: 'Islam' },
    { value: 'kristen', label: 'Kristen' },
    { value: 'katolik', label: 'Katolik' },
    { value: 'hindu', label: 'Hindu' },
    { value: 'buddha', label: 'Buddha' },
    { value: 'konghucu', label: 'Konghucu' },
  ];
  
  export const pendidikanOptions = [
    { value: 'tidak_sekolah', label: 'Tidak Sekolah' },
    { value: 'sd', label: 'SD' },
    { value: 'smp', label: 'SMP' },
    { value: 'sma', label: 'SMA/SMK' },
    { value: 'd1', label: 'D1' },
    { value: 'd2', label: 'D2' },
    { value: 'd3', label: 'D3' },
    { value: 's1', label: 'S1' },
    { value: 's2', label: 'S2' },
    { value: 's3', label: 'S3' },
  ];
  
  export const asnafOptions = [
    { value: "fakir", label: "Fakir" },
    { value: "miskin", label: "Miskin" },
    { value: "amil", label: "Amil" },
    { value: "muallaf", label: "Muallaf" },
    { value: "riqab", label: "Riqab" },
    { value: "gharim", label: "Gharim" },
    { value: "fisabilillah", label: "Fisabilillah" },
    { value: "ibnu sabil", label: "Ibnu Sabil" }
  ];


  type MenuItem = {
    title: string;
    iconDefault: string;
    iconActive: string;
    href: string;
    roles: string[];
  };

  export const menuItems: MenuItem[] = [
    {
      title: "Home",
      iconDefault: "/images/icon-home-w.svg",
      iconActive: "/images/icon-home-t.svg",
      href: "/dashboard",
      roles: ["amil", "superadmin", "relawan"],
    },
    {
      title: "Kelola Pengguna",
      iconDefault: "/images/icon-kelola-pengguna-w.svg",
      iconActive: "/images/icon-kelola-pengguna-t.svg",
      href: "/dashboard/kelola-pengguna",
      roles: ["superadmin"],
    },
    {
      title: "Kelola Program",
      iconDefault: "/images/icon-kelola-program-w.svg",
      iconActive: "/images/icon-kelola-program-t.svg",
      href: "/dashboard/kelola-program",
      roles: ["superadmin"],
    },
    {
      title: "Kelola Penyaluran",
      iconDefault: "/images/icon-kelola-penyaluran-w.svg",
      iconActive: "/images/icon-kelola-penyaluran-t.svg",
      href: "/dashboard/kelola-penyaluran",
      roles: ["superadmin"],
    },
    {
      title: "Kelola Mustahiq",
      iconDefault: "/images/icon-kelola-mustahiq-w.svg",
      iconActive: "/images/icon-kelola-mustahiq-t.svg",
      href: "/dashboard/kelola-mustahiq",
      roles: ["amil", "superadmin", "relawan"],
    },
    {
      title: "Kelola Pengaturan",
      iconDefault: "/images/icon-pengaturan-w.svg", 
      iconActive: "/images/icon-pengaturan-t.svg",
      href: "/dashboard/kelola-pengaturan", 
      roles: ["amil", "superadmin"],
    }
  ];