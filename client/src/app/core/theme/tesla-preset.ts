/**
 * ธีม PrimeNG ของ TESLA Management — ต่อจาก Aura แล้วเปลี่ยนสีหลักเป็นน้ำเงิน Brand (#00317A / #00194B)
 * แก้สี/ค่ากลางของ Component ได้ที่ไฟล์นี้ (ดู https://v21.primeng.org/theming/styled)
 * ขนาดตัวอักษรมาตรฐาน 14px ตั้งที่ html { font-size: 14px } ใน styles.scss (PrimeNG ใช้หน่วย rem)
 */
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const TeslaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef3fb',
      100: '#d6e2f5',
      200: '#adc4ea',
      300: '#7f9fd8',
      400: '#4f76c0',
      500: '#2854a7',
      600: '#1c448f',
      700: '#00317a',
      800: '#002560',
      900: '#00194b',
      950: '#000f30',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.700}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.900}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
        formField: {
          borderColor: '#e6e6e6',
          hoverBorderColor: '{primary.400}',
          focusBorderColor: '{primary.700}',
          borderRadius: '8px',
        },
      },
    },
  },
});
