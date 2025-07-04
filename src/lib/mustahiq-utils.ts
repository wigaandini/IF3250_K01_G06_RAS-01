// Extended toSentenceCase with special mappings
const toSentenceCase = (text: string | null | undefined): string => {
    if (!text) return "-";
    
    // Special mappings
    const specialCases: Record<string, string> = {
      'nik': 'NIK',
      'kk': 'KK',
      'ktp': 'KTP',
      'laki-laki': 'Laki-laki',
      'perempuan': 'Perempuan',
      'belum_menikah': 'Belum Menikah',
      'menikah': 'Menikah',
      'cerai_hidup': 'Cerai Hidup',
      'cerai_mati': 'Cerai Mati',
      'islam': 'Islam',
      'kristen': 'Kristen',
      'katolik': 'Katolik',
      'hindu': 'Hindu',
      'buddha': 'Buddha',
      'konghucu': 'Konghucu'
    };
  
    // Check if text matches any special case
    const lowerText = text.toLowerCase();
    if (specialCases[lowerText]) {
      return specialCases[lowerText];
    }
  
    // Convert snake_case and underscores to spaces
    const spacedText = text.replace(/[_]/g, ' ');
  
    // Convert to sentence case
    return spacedText
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

const toUpperCase = (text: string | null | undefined): string => {
    
    if (!text) return "-";
    return text.toUpperCase();
  }

export const transformMustahiqData = (data: any) => {
    return {
      ...data,
      jenis_kelamin: data.jenis_kelamin.toLowerCase(),
      status_pernikahan: data.status_pernikahan.toLowerCase().replace(' ', '_'),
      pendidikan_terakhir: data.pendidikan_terakhir.toLowerCase(),
    };
  };
  
  export const displayMustahiqData = (data: any) => {
    return {
      ...data,
      jenis_kelamin: toSentenceCase(data.jenis_kelamin),
      status_pernikahan: toSentenceCase(data.status_pernikahan),
      pendidikan_terakhir: toUpperCase(data.pendidikan_terakhir),
    };
  };