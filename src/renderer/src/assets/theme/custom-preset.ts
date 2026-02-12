/**
 * PrimeVue Theme Preset — Clean, minimal, near-flat
 * Based on Aura preset with slate/neutral palette.
 * Minimal border-radius, subtle shadows, professional look.
 */
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const ProfessionalPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{slate.50}',
      100: '{slate.100}',
      200: '{slate.200}',
      300: '{slate.300}',
      400: '{slate.400}',
      500: '{slate.500}',
      600: '{slate.600}',
      700: '{slate.700}',
      800: '{slate.800}',
      900: '{slate.900}',
      950: '{slate.950}'
    },
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '3px',
      md: '5px',
      lg: '6px',
      xl: '8px'
    },
    colorScheme: {
      dark: {
        surface: {
          0: '#e8eaed',
          50: '#d0d3da',
          100: '#8b919e',
          200: '#565c68',
          300: '#3a4150',
          400: '#2a303c',
          500: '#1e222b',
          600: '#1c2028',
          700: '#1e222b',
          800: '#161a21',
          900: '#12151a',
          950: '#0c0e12'
        },
        primary: {
          color: '{zinc.50}',
          inverseColor: '{zinc.950}',
          hoverColor: '{zinc.200}',
          activeColor: '{zinc.300}'
        },
        highlight: {
          background: 'rgba(255, 255, 255, 0.08)',
          focusBackground: 'rgba(255, 255, 255, 0.12)',
          color: 'rgba(255, 255, 255, 0.87)',
          focusColor: 'rgba(255, 255, 255, 0.87)'
        },
        formField: {
          background: '{surface.900}',
          disabledBackground: '{surface.800}',
          filledBackground: '{surface.900}',
          filledHoverBackground: '{surface.900}',
          filledFocusBackground: '{surface.900}',
          borderColor: '{surface.700}',
          hoverBorderColor: '{surface.600}',
          focusBorderColor: '{surface.500}',
          invalidBorderColor: '{red.400}',
          color: '{surface.0}',
          disabledColor: '{surface.500}',
          placeholderColor: '{surface.500}',
          invalidPlaceholderColor: '{red.300}',
          floatLabelColor: '{surface.500}',
          floatLabelFocusColor: '{surface.300}',
          floatLabelActiveColor: '{surface.500}',
          floatLabelInvalidColor: '{red.400}',
          iconColor: '{surface.500}',
          shadow: 'none'
        },
        text: {
          color: '{surface.0}',
          hoverColor: '{surface.0}',
          mutedColor: '{surface.400}',
          hoverMutedColor: '{surface.300}'
        },
        content: {
          background: '{surface.900}',
          hoverBackground: '{surface.800}',
          borderColor: '{surface.700}',
          color: '{surface.0}',
          hoverColor: '{surface.0}'
        },
        overlay: {
          select: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{surface.0}'
          },
          popover: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{surface.0}'
          },
          modal: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{surface.0}'
          }
        },
        navigation: {
          item: {
            focusBackground: '{surface.800}',
            activeBackground: '{surface.800}',
            color: '{surface.400}',
            focusColor: '{surface.0}',
            activeColor: '{surface.0}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.0}',
              activeColor: '{surface.0}'
            }
          },
          submenuLabel: {
            background: 'transparent',
            color: '{surface.400}'
          },
          submenuIcon: {
            color: '{surface.500}',
            focusColor: '{surface.0}',
            activeColor: '{surface.0}'
          }
        }
      },
      light: {
        surface: {
          0: '#ffffff',
          50: '#f7f8fa',
          100: '#f0f1f4',
          200: '#e2e4ea',
          300: '#cdd0d8',
          400: '#9198a5',
          500: '#6b7280',
          600: '#50555f',
          700: '#3a3f4a',
          800: '#252830',
          900: '#181a20',
          950: '#111318'
        },
        primary: {
          color: '{zinc.950}',
          inverseColor: '{zinc.50}',
          hoverColor: '{zinc.800}',
          activeColor: '{zinc.700}'
        },
        highlight: {
          background: 'rgba(0, 0, 0, 0.06)',
          focusBackground: 'rgba(0, 0, 0, 0.1)',
          color: '{zinc.950}',
          focusColor: '{zinc.950}'
        },
        formField: {
          background: '{surface.0}',
          disabledBackground: '{surface.100}',
          filledBackground: '{surface.50}',
          filledHoverBackground: '{surface.50}',
          filledFocusBackground: '{surface.50}',
          borderColor: '{surface.300}',
          hoverBorderColor: '{surface.400}',
          focusBorderColor: '{surface.600}',
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
