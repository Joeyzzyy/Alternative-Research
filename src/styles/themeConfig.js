const themeConfig = {
  // 普通主题
  normal: {
    button: {
      base: 'px-8 py-3 rounded-3xl text-lg font-semibold transition-all duration-200',
      variants: {
        primary: 'bg-[#3374FF] text-white hover:bg-[#2861E5]',
        secondary: 'border-2 border-[#3374FF] text-[#3374FF] hover:bg-[#3374FF] hover:text-white',
        outline: 'border-2 border-gray-200 text-gray-700 hover:border-[#3374FF] hover:text-[#3374FF]'
      },
      sizes: {
        sm: 'px-4 py-2 text-sm',
        md: 'px-8 py-3 text-lg',
        lg: 'px-10 py-4 text-xl'
      }
    },
    section: {
      base: 'w-full transition-all duration-200',
      background: {
        primary: '',
        secondary: '',
        highlight: 'bg-gray-100'
      },
      padding: {
        base: 'py-12 md:py-16',
        large: 'py-16 md:py-24',
        wide: 'py-12 md:py-20',
        narrow: 'py-8 md:py-12'
      }
    },
    card: {
      base: 'rounded-lg transition-all duration-200',
      variants: {
        primary: 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm',
        featured: 'bg-white border-2 border-[#3374FF] shadow-lg',
        plain: 'bg-white shadow-sm'
      },
      padding: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
      }
    },
    text: {
      color: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        accent: 'text-[#3374FF]',
        white: 'text-white'
      }
    },
    typography: {
      h1: {
        fontSize: 'text-4xl md:text-5xl',
        fontWeight: 'font-bold',
        color: 'text-gray-900'
      },
      h2: {
        fontSize: 'text-3xl md:text-4xl',
        fontWeight: 'font-bold',
        color: 'text-gray-900'
      },
      h3: {
        fontSize: 'text-xl md:text-2xl',
        fontWeight: 'font-semibold',
        color: 'text-gray-900'
      },
      h4: {
        fontSize: 'text-lg md:text-xl',
        fontWeight: 'font-semibold',
        color: 'text-gray-900'
      },
      h5: {
        fontSize: 'text-base md:text-lg',
        fontWeight: 'font-medium',
        color: 'text-gray-700'
      },
      paragraph: {
        fontSize: 'text-base',
        color: 'text-gray-600'
      },
      caption: {
        fontSize: 'text-sm',
        color: 'text-gray-500',
        fontWeight: 'font-medium'
      },
      link: {
        color: 'text-gray-500',
        hoverColor: 'text-gray-900'
      }
    },
    table: {
      background: 'bg-white',
      header: {
        background: 'bg-gray-50',
        text: 'text-gray-900'
      },
      border: 'border-gray-100',
      hover: 'hover:bg-gray-50/50'
    }
  },

  // 科技主题
  tech: {
    button: {
      base: 'px-8 py-3 rounded-3xl text-lg font-semibold transition-all duration-300',
      variants: {
        primary: 'bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 text-white hover:from-blue-700 hover:via-indigo-600 hover:to-violet-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.7)] hover:scale-[1.02]',
        secondary: 'border-2 border-indigo-400/50 text-indigo-500 hover:bg-gradient-to-r hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 hover:text-white backdrop-blur-xl bg-white/20 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]',
        outline: 'border-2 border-indigo-200/70 text-indigo-600 hover:border-indigo-400 hover:text-indigo-700 bg-white/40 backdrop-blur-xl hover:bg-white/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]'
      },
      sizes: {
        sm: 'px-4 py-2 text-sm',
        md: 'px-8 py-3 text-lg',
        lg: 'px-10 py-4 text-xl'
      }
    },
    section: {
      base: 'w-full transition-all duration-200',
      background: {
        primary: '',
        secondary: '',
        highlight: ''
      },
      padding: {
        base: 'py-12 md:py-16',
        large: 'py-16 md:py-24',
        wide: 'py-12 md:py-20',
        narrow: 'py-8 md:py-12'
      }
    },
    card: {
      base: 'rounded-xl transition-all duration-300',
      variants: {
        primary: 'bg-white/50 backdrop-blur-xl border border-white/30 hover:border-indigo-200/70 hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)] hover:scale-[1.01]',
        featured: 'bg-gradient-to-br from-white/90 to-indigo-50/80 backdrop-blur-2xl border-2 border-indigo-400/50 shadow-[0_8px_32px_rgba(99,102,241,0.2)] hover:shadow-[0_16px_48px_rgba(99,102,241,0.25)] hover:scale-[1.02]',
        plain: 'bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-[0_8px_24px_rgba(99,102,241,0.15)] hover:scale-[1.01]'
      },
      padding: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
      }
    },
    text: {
      color: {
        primary: 'text-gray-800',
        secondary: 'text-blue-900/70',
        accent: 'text-blue-600',
        white: 'text-white'
      }
    },
    typography: {
      h1: {
        fontSize: 'text-4xl md:text-5xl',
        fontWeight: 'font-bold',
        color: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 drop-shadow-sm'
      },
      h2: {
        fontSize: 'text-3xl md:text-4xl',
        fontWeight: 'font-bold',
        color: 'text-gray-900'
      },
      h3: {
        fontSize: 'text-xl md:text-2xl',
        fontWeight: 'font-semibold',
        color: 'text-gray-900'
      },
      h4: {
        fontSize: 'text-lg md:text-xl',
        fontWeight: 'font-semibold',
        color: 'text-gray-900'
      },
      h5: {
        fontSize: 'text-base md:text-lg',
        fontWeight: 'font-medium',
        color: 'text-gray-700'
      },
      paragraph: {
        fontSize: 'text-base',
        color: 'text-gray-600'
      },
      caption: {
        fontSize: 'text-sm',
        color: 'text-indigo-500',
        fontWeight: 'font-medium'
      },
      link: {
        color: 'text-indigo-500',
        hoverColor: 'text-indigo-700'
      }
    },
    table: {
      background: 'bg-indigo-50/50',
      header: {
        background: 'bg-indigo-100/50',
        text: 'text-indigo-900'
      },
      border: 'border-indigo-100',
      hover: 'hover:bg-indigo-50/50'
    }
  },
};

export default themeConfig; 