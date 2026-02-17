/**
 * PrimeVue Theme Preset - Minimal professional design
 * Based on Aura with neutral palette.
 * CTA primary = white (dark) / dark (light) for maximum contrast.
 */
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const ProfessionalPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{zinc.50}',
      100: '{zinc.100}',
      200: '{zinc.200}',
      300: '{zinc.300}',
      400: '{zinc.400}',
      500: '{zinc.500}',
      600: '{zinc.600}',
      700: '{zinc.700}',
      800: '{zinc.800}',
      900: '{zinc.900}',
      950: '{zinc.950}'
    },
    borderRadius: {
      none: '0',
      xs: '3px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '10px'
    },
    colorScheme: {
      dark: {
        surface: {
          0: '#ececef',
          50: '#d4d4d8',
          100: '#8b8b95',
          200: '#55555e',
          300: '#3a3a42',
          400: '#2a2a30',
          500: '#1f1f23',
          600: '#1a1a1e',
          700: '#1f1f23',
          800: '#141416',
          900: '#111113',
          950: '#09090b'
        },
        primary: {
          color: '#ececef',
          inverseColor: '#111113',
          hoverColor: '#d4d4d8',
          activeColor: '#a1a1aa'
        },
        highlight: {
          background: 'rgba(255, 255, 255, 0.06)',
          focusBackground: 'rgba(255, 255, 255, 0.10)',
          color: 'rgba(255, 255, 255, 0.87)',
          focusColor: 'rgba(255, 255, 255, 0.87)'
        },
        formField: {
          background: '{surface.800}',
          disabledBackground: '{surface.700}',
          filledBackground: '{surface.800}',
          filledHoverBackground: '{surface.800}',
          filledFocusBackground: '{surface.800}',
          borderColor: '{surface.500}',
          hoverBorderColor: '{surface.400}',
          focusBorderColor: '{surface.300}',
          invalidBorderColor: '{red.400}',
          color: '{surface.0}',
          disabledColor: '{surface.400}',
          placeholderColor: '{surface.400}',
          invalidPlaceholderColor: '{red.300}',
          floatLabelColor: '{surface.400}',
          floatLabelFocusColor: '{surface.200}',
          floatLabelActiveColor: '{surface.400}',
          floatLabelInvalidColor: '{red.400}',
          iconColor: '{surface.400}',
          shadow: 'none'
        },
        text: {
          color: '{surface.0}',
          hoverColor: '{surface.0}',
          mutedColor: '{surface.300}',
          hoverMutedColor: '{surface.200}'
        },
        content: {
          background: '{surface.900}',
          hoverBackground: '{surface.800}',
          borderColor: '{surface.500}',
          color: '{surface.0}',
          hoverColor: '{surface.0}'
        },
        overlay: {
          select: {
            background: '{surface.800}',
            borderColor: '{surface.500}',
            color: '{surface.0}'
          },
          popover: {
            background: '{surface.800}',
            borderColor: '{surface.500}',
            color: '{surface.0}'
          },
          modal: {
            background: '{surface.800}',
            borderColor: '{surface.500}',
            color: '{surface.0}'
          }
        },
        navigation: {
          item: {
            focusBackground: '{surface.700}',
            activeBackground: '{surface.700}',
            color: '{surface.300}',
            focusColor: '{surface.0}',
            activeColor: '{surface.0}',
            icon: {
              color: '{surface.400}',
              focusColor: '{surface.0}',
              activeColor: '{surface.0}'
            }
          },
          submenuLabel: {
            background: 'transparent',
            color: '{surface.400}'
          },
          submenuIcon: {
            color: '{surface.400}',
            focusColor: '{surface.0}',
            activeColor: '{surface.0}'
          }
        }
      },
      light: {
        surface: {
          0: '#ffffff',
          50: '#f8f8fa',
          100: '#f0f0f2',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b'
        },
        primary: {
          color: '#18181b',
          inverseColor: '#fafafa',
          hoverColor: '#27272a',
          activeColor: '#3f3f46'
        },
        highlight: {
          background: 'rgba(0, 0, 0, 0.04)',
          focusBackground: 'rgba(0, 0, 0, 0.08)',
          color: '{zinc.950}',
          focusColor: '{zinc.950}'
        },
        formField: {
          background: '{surface.0}',
          disabledBackground: '{surface.100}',
          filledBackground: '{surface.50}',
          filledHoverBackground: '{surface.50}',
          filledFocusBackground: '{surface.50}',
          borderColor: '{surface.200}',
          hoverBorderColor: '{surface.300}',
          focusBorderColor: '{surface.500}',
          invalidBorderColor: '{red.500}',
          color: '{surface.950}',
          disabledColor: '{surface.400}',
          placeholderColor: '{surface.400}',
          invalidPlaceholderColor: '{red.400}',
          floatLabelColor: '{surface.500}',
          floatLabelFocusColor: '{surface.700}',
          floatLabelActiveColor: '{surface.500}',
          floatLabelInvalidColor: '{red.500}',
          iconColor: '{surface.500}',
          shadow: 'none'
        },
        text: {
          color: '{surface.950}',
          hoverColor: '{surface.950}',
          mutedColor: '{surface.500}',
          hoverMutedColor: '{surface.700}'
        },
        content: {
          background: '{surface.0}',
          hoverBackground: '{surface.100}',
          borderColor: '{surface.200}',
          color: '{surface.950}',
          hoverColor: '{surface.950}'
        },
        overlay: {
          select: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{surface.950}'
          },
          popover: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{surface.950}'
          },
          modal: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{surface.950}'
          }
        },
        navigation: {
          item: {
            focusBackground: '{surface.100}',
            activeBackground: '{surface.100}',
            color: '{surface.600}',
            focusColor: '{surface.950}',
            activeColor: '{surface.950}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.950}',
              activeColor: '{surface.950}'
            }
          },
          submenuLabel: {
            background: 'transparent',
            color: '{surface.500}'
          },
          submenuIcon: {
            color: '{surface.500}',
            focusColor: '{surface.950}',
            activeColor: '{surface.950}'
          }
        }
      }
    }
  }
})

export default ProfessionalPreset
