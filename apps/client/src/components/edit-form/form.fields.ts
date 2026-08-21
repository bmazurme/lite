const fields = [
  {
    name: 'title',
    label: 'Название',
    pattern: {
      value: /^[A-Za-zА-ЯЁа-яё0-9.,:;→+()/{}#$%@ -]{3,150}$/,
      message: 'Допустимы буквы, цифры и символы . , : ; → - + ( ) / { } # $ % @ (от 3 до 150 символов)',
    },
    required: 'Обязательно к заполнению',
    autoComplete: 'title',
  },
  {
    name: 'type',
    label: 'Описание',
    required: 'Обязательно к заполнению',
  },
];

export default fields;
