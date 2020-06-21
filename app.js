(function() {
  const CONSTANTS = {
    COLORS: [
      '#2c2c54',
      '#c0392b',
      '#f39c12',
      '#1abc9c',
      '#3498db',
      '#9b59b6',
      '#34495e',
      '#2ecc71',
      '#8e44ad',
      '#3d3d3d',
      '#e67e22',
      '#2980b9',
      '#27ae60',
      '#40407a',
      '#f1c40f',
      '#182C61',
      '#e74c3c',
      '#2c3e50',
      '#d35400',
      '#273c75',
      '#192a56',
      '#c23616',
      '#3B3B98',
      '#4b4b4b',
      '#17c0eb',
    ],
    DOM_STRINGS: {
      0: `ul[data-day="0"]`,
      1: `ul[data-day="1"]`,
      2: `ul[data-day="2"]`,
      3: `ul[data-day="3"]`,
      4: `ul[data-day="4"]`,
      5: `ul[data-day="5"]`,
      6: `ul[data-day="6"]`,
      form: '.form',
      json_inp: '#json_inp',
      year_inp: '#year_inp',
      error_wrapper: '.error_wrapper',
      error_list: '.error_list',
    },
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    CLASS_NAMES: {
      WARNING: 'warning',
      HIDE: 'hide',
      DAY_EMPTY: 'day--empty',
      DAY_PERSON: 'day__person',
    },
    INVALID_DATE: 'Invalid Date',
  };

  const helpers = (function(CONSTANTS) {
    function comparator(d1 = {}, d2 = {}) {
      if (d1.date.getTime() > d2.date.getTime()) {
        return -1;
      } else if (d1.date.getTime() < d2.date.getTime()) {
        return 1;
      } else if (d1.date.getTime() === d2.date.getTime() && d1.name > d2.name) {
        return 1;
      }
      return -1;
    }

    function getSorted(arr = []) {
      return arr.sort(comparator);
    }

    function formatPerson(data = {}, year, options) {
      return {
        name: data.name,
        initials: getInitials(data.name, {...options, name: data.name}),
        date: new Date(data.birthday),
        day: getDay(data.birthday, year, {...options, name: data.name}),
        currentYear: year,
      }
    }

    function getInitials(name = '', options) {
      if (!name.trim()) {
        options.handleReportErrorWarning(`<span>Some person/persons in the given data <strong>doesn't have names</strong>, will be displaying <strong>blank tile</strong> for them</span>`, CONSTANTS.WARNING);
      }
      name = name.trim().split(' ');
      if (name.length <= 1) return name[0][0] || '';
      return name[0][0] + name[1][0];
    }
    
    function checkAndRaiseWarningForInvalidDateFormat(date, options) {
      let [month = '', day = '', year = ''] = date.split('/');
      month = Number(month);
      day = Number(day);
      year = Number(year);
      const d = new Date(date);
      if (isNaN(month) || month < 1 || month > 12 || isNaN(day) || day < 1 || day > 31 || isNaN(year) || year < 1 || d.toString() === CONSTANTS.INVALID_DATE) {
        console.warn(`Invalid Date format ${date} for person ${options.name}`);
        options.handleReportErrorWarning(`<span>The birthday <strong>${date}</strong> provided for <strong>${options.name}</strong> is invalid. Result may not be accurate</span>`, CONSTANTS.WARNING);
      }
    }

    function getDay(date = new Date(), year, options) {
      checkAndRaiseWarningForInvalidDateFormat(date, options);
      date = new Date(date);
      date.setFullYear(year)
      return date.getDay();
    }

    function getFormattedData(personsList = [], year = 2020, options) {
      let formattedPersonsList = [[], [], [], [], [], [], []];
      personsList.forEach(person => {
        const formattedPerson = formatPerson(person, year, options);
        formattedPersonsList[formattedPerson.day].push(formattedPerson);
      });
      formattedPersonsList = formattedPersonsList.map(list => getSorted(list))
      return formattedPersonsList;
    }

    function getOptimalGridTemplateCount(count = 0) {
      if (count <= 1) return 1;
      const sq = Math.sqrt(count);
      if (Number.isInteger(sq)) return sq;
      return parseInt(`${sq}`) + 1;
    }

    function getDOMElements() {
      let DOMElements = {};
      for (let selector in CONSTANTS.DOM_STRINGS) {
        DOMElements[selector] = document.querySelector(CONSTANTS.DOM_STRINGS[selector]);
      }
      return DOMElements;
    }

    return {
      getFormattedData,
      getOptimalGridTemplateCount,
      getDOMElements,
    }
  })(CONSTANTS);

  const modalController = (function(helpers) {
    const state = {
      birthdayData: [[], [], [], [], [], [], []],
      currentYear: 2020,
      colorCount: 0,
    };

    function resetBirthdayData() {
      state.birthdayData = [[], [], [], [], [], [], []];
    }

    function storeData(JSONData , year, options = {}) {
      state.currentYear = year;
      state.birthdayData = helpers.getFormattedData(JSONData, year, options);
    }

    function getBirthdayData() {
      return state.birthdayData;
    }

    function getColor() {
      const color = CONSTANTS.COLORS[state.colorCount];
      state.colorCount += 1;
      if (state.colorCount >= CONSTANTS.COLORS.length) {
        state.colorCount = 0;
      }
      return color;
    }

    return {
      resetBirthdayData,
      storeData,
      getBirthdayData,
      getColor,
    }
  })(helpers);

  const viewController = (function(modalController, helperS, CONSTANTS) {
    const DOMElements = helpers.getDOMElements();

    function getBirthdayListMarkup(name, initial) {
      return `<li class="day_birthday_list_item" title="${name}" style="background:${modalController.getColor()}">${initial}</li>`
    }

    function getErrorListItemMarkup(message = '', type = CONSTANTS.ERROR) {
      return `<li class="error_item ${type === CONSTANTS.WARNING ? CONSTANTS.CLASS_NAMES.WARNING : ''}">${message}</li>`
    }

    function toggleErrorWrapperVisibility(visible = true) {
      if (visible) {
        DOMElements.error_wrapper.classList.remove(CONSTANTS.CLASS_NAMES.HIDE);
      } else {
        DOMElements.error_wrapper.classList.add(CONSTANTS.CLASS_NAMES.HIDE);
      }
    }

    function clearErrorListInnerHTML() {
      DOMElements.error_list.innerHTML = '';
    }
    
    function insertErrorWarning(message = '', type = CONSTANTS.ERROR) {
      const markup = getErrorListItemMarkup(message, type);
      DOMElements.error_list.insertAdjacentHTML('beforeend', markup);
    }

    function getEmptyBirthdayListItemMarkup() {
      return `<li class="day_birthday_list_item" style="opacity: 0.2; background: var(--color-list-bck)"><img src="./assets/mustach.png" alt="mustach"></li>`
    }

    function addClassNameForDayList(hasBirthdays, index) {
      if (hasBirthdays) {
        DOMElements[index].classList.add(CONSTANTS.CLASS_NAMES.DAY_PERSON);
        DOMElements[index].classList.remove(CONSTANTS.CLASS_NAMES.DAY_EMPTY);
      } else {
        DOMElements[index].classList.remove(CONSTANTS.CLASS_NAMES.DAY_PERSON);
        DOMElements[index].classList.add(CONSTANTS.CLASS_NAMES.DAY_EMPTY);
      }
    }

    function renderBirthdayList(birthdayList = []) {
      birthdayList.forEach((dayList, index) => {
        const optimalGridTemplateCount = helpers.getOptimalGridTemplateCount(dayList.length);
        const gridTemplateStyle = `repeat(${optimalGridTemplateCount}, 1fr)`;
        DOMElements[index].style.gridTemplateColumns = gridTemplateStyle;
        DOMElements[index].style.gridTemplateRows = gridTemplateStyle;
        DOMElements[index].innerHTML = '';
        addClassNameForDayList(dayList.length > 0, index);
        if (dayList.length === 0) {
          DOMElements[index].innerHTML = getEmptyBirthdayListItemMarkup();
          return;
        }
        DOMElements[index].innerHTML = dayList.map(birthday => getBirthdayListMarkup(birthday.name, birthday.initials)).join('');
      });
    }

    return {
      renderBirthdayList,
      toggleErrorWrapperVisibility,
      insertErrorWarning,
      clearErrorListInnerHTML,
    }
  })(modalController, helpers, CONSTANTS);

  const appController = (function(modalController, viewController, helpers, CONSTANTS) {
    const DOMElements = helpers.getDOMElements();

    function handleReportErrorWarning(message = '', type = CONSTANTS.ERROR) {
      viewController.toggleErrorWrapperVisibility(true);
      viewController.insertErrorWarning(message, type);
    }

    function handleFormSubmit(event) {
      event.preventDefault();
      viewController.clearErrorListInnerHTML();
      viewController.toggleErrorWrapperVisibility(false);
      try {
        const unFormattedBirthdayData = JSON.parse(DOMElements.json_inp.value);
        const year = Number(DOMElements.year_inp.value);
        if (isNaN(year) || year < 1) {
          // noinspection ExceptionCaughtLocallyJS
          throw new Error("Year must be a <strong>Natural Number</strong>");
        }
        modalController.storeData(unFormattedBirthdayData, year, { handleReportErrorWarning });
        viewController.renderBirthdayList(modalController.getBirthdayData());
      } catch (e) {
        console.error(e.message);
        modalController.resetBirthdayData();
        viewController.renderBirthdayList(modalController.getBirthdayData());
        viewController.toggleErrorWrapperVisibility(true);
        viewController.insertErrorWarning(e.toString(), CONSTANTS.ERROR);
      }
    }

    function init() {
      DOMElements.form.addEventListener('submit', handleFormSubmit);
    }

    return {
      init,
    }
  })(modalController, viewController, helpers, CONSTANTS)

  appController.init();
})();
