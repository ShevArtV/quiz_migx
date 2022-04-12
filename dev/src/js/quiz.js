export default class Quiz {
    constructor(selector, config) {
        this.form = document.querySelector(selector);

        if (!this.form) {
            console.error('Form not found. Check the correctness of the selector.');
            return false;
        }

        this.defaults = {
            errorText: 'Заполните поле!',
            disabledClass: 'disabled',
            hiddenClass: 'visually-hidden',
            displayNoneClass: 'd-none',
            autoChangeClass: 'jsAutoChange',
            formClass: 'jsQuizForm',
            inputSelector: '.jsInput',
            progressBarBgTransparentClass: 'bg-transparent',
            progressBarWidthClass: 'w-100',
            progressBarTextColorClass: 'text-primary',

            items: this.form.querySelectorAll('.jsQuizItem'),
            progressBar: this.form.querySelector('.jsQuizProgress'),
            btnBack: this.form.querySelector('.jsQuizBtnBack'),
            btnForward: this.form.querySelector('.jsQuizBtnForward'),
            btnSubmit: this.form.querySelector('.jsQuizBtnSubmit'),
            thankElem: document.querySelector('.jsQuizThanks'),
            errorElement: this.form.querySelector('.jsError'),
            addForItems: this.form.querySelectorAll('.jsAddItem'),
        };

        this.config = Object.assign({}, this.defaults, config);
        this.config.btnForward.dataset.target = this.config.items[1].id;
        this.config.btnBack.dataset.target = this.config.items[0].id;

        this.initialize();
    }

    initialize() {
        const $this = this,
            inputs = $this.form.querySelectorAll(this.config.inputSelector);
        $this.config.errorElement.style.opacity = 0;
        console.log(this);
        if ($this.validate(0)) {
            $this.enableBtn($this.config.btnForward);
        } else {
            $this.disableBtn($this.config.btnForward);
        }
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('change', (e) => this.changeListener(e, inputs[i]));
            inputs[i].addEventListener('input', (e) => {
                if (inputs[i].value) {
                    this.enableBtn(this.config.btnForward);
                    this.hideError(this.config.errorElement);
                } else {
                    this.disableBtn(this.config.btnForward);
                    this.showError(this.config.errorElement);
                }
            });
        }


        $this.config.btnForward.addEventListener('click', function (e) {
            $this.changeQ('forward');
        });

        $this.config.btnBack.addEventListener('click', function (e) {
            $this.changeQ('back');
        });

        if ($this.config.addForItems.length) {
            $this.showAdd($this.config.items[0].id);
        }

        if (window.jQuery) {
            $(document).on('af_complete', function (event, response) {
                if (response.success && $(response.form).hasClass($this.config.formClass)) {
                    $this.successSubmit();
                }
            });
        }
    }

    showError(element) {
        element.innerText = this.config.errorText;
        element.style.opacity = 1;
    }

    hideError(element) {
        element.innerText = '';
        element.style.opacity = 0;
    }

    enableBtn(element) {
        element.classList.remove(this.config.disabledClass);
    }

    disableBtn(element) {
        element.classList.add(this.config.disabledClass);
    }

    getCurIndex() {
        let items = this.config.items;
        for (let i = 0; i < items.length; i++) {
            if (!items[i].classList.contains(this.config.hiddenClass)) {
                return i;
            }
        }
    }

    validate(index) {
        let items = this.config.items,
            inputs = items[index].querySelectorAll(this.config.inputSelector),
            bool = false;
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].dataset.required) {
                if (inputs[i].getAttribute('type') == 'radio' || inputs[i].getAttribute('type') == 'checkbox') {
                    if (inputs[i].checked) {
                        bool = true;
                    }
                } else {
                    if (inputs[i].value) {
                        bool = true;
                    }
                }
            } else {
                bool = true;
            }
        }
        return bool;
    };

    progress() {
        let progressBar = this.config.progressBar,
            width = 0,
            targets = this.config.btnBack.dataset.target,
            curIndex = this.getCurIndex(),
            items = this.config.items,
            leftCount = 0,
            history = targets ? targets.split(',') : [];

        items.forEach((el, index) => {
            if (index > curIndex) {
                leftCount++;
            }
        });
        width = Math.round(history.length / (history.length + leftCount) * 100);
        if (width) {
            progressBar.classList.remove(
                this.config.progressBarBgTransparentClass,
                this.config.progressBarTextColorClass,
                this.config.progressBarWidthClass
            );
            progressBar.style.width = width + '%';
            progressBar.innerText = width + '%';
        } else {
            progressBar.classList.add(
                this.config.progressBarBgTransparentClass,
                this.config.progressBarTextColorClass,
                this.config.progressBarWidthClass
            );
            progressBar.style.width = width;
            progressBar.innerText = '0%';
        }
    }

    changeQ(direction) {
        let items = this.config.items,
            btnForward = this.config.btnForward,
            btnSubmit = this.config.btnSubmit,
            btnBack = this.config.btnBack,
            curIndex = this.getCurIndex(),
            target = direction == 'forward' ? btnForward.dataset.target.split(',') : btnBack.dataset.target.split(','),
            targetEl = document.getElementById(target[target.length - 1]),
            quizEvent = new CustomEvent('question_change', {
                detail: {
                    curIndex: curIndex,
                    direction: direction,
                    btnBack: btnBack,
                    btnForward: btnForward,
                    btnSubmit: btnSubmit,
                    activeItem: items[curIndex]
                }
            });

        items[curIndex].classList.add(this.config.hiddenClass);

        if (targetEl) {
            targetEl.classList.remove(this.config.hiddenClass);
            items[curIndex].classList.add(this.config.hiddenClass);
        }
        if (targetEl.id == items[items.length - 1].id) {
            btnForward.classList.add(this.config.displayNoneClass);
            btnSubmit.classList.remove(this.config.displayNoneClass);
        } else {
            btnForward.classList.remove(this.config.displayNoneClass);
            btnSubmit.classList.add(this.config.displayNoneClass);
        }
        if (targetEl.id != items[0].id) {
            btnBack.classList.remove(this.config.hiddenClass);
            btnBack.classList.remove(this.config.disabledClass);
        } else {
            btnBack.classList.add(this.config.hiddenClass);
            btnBack.classList.add(this.config.disabledClass);
        }
        this.setPrevNext(curIndex, targetEl, direction);
        this.form.dispatchEvent(quizEvent);
        if (this.config.addForItems.length) {
            this.showAdd(targetEl.id);
        }
    }

    showAdd(curItemID) {
        let allItems = this.config.addForItems;
        allItems.forEach((el) => {
            el.classList.add(this.config.displayNoneClass);
            if (el.dataset.for == curItemID) {
                el.classList.remove(this.config.displayNoneClass)
            }
        });
    }

    successSubmit() {
        let items = this.config.items;
        this.form.reset();
        this.config.btnBack.classList.add(this.config.hiddenClass, this.config.disabledClass);
        this.config.btnBack.removeAttribute('data-target');
        this.config.btnSubmit.classList.add(this.config.displayNoneClass);
        this.config.btnForward.classList.remove(this.config.displayNoneClass);
        this.progress();
        for (let i = 0; i < items.length; i++) {
            if (i > 0) {
                items[i].classList.add(this.config.hiddenClass);
            } else {
                items[i].classList.remove(this.config.hiddenClass);
            }
        }
        if (this.validate(0)) {
            this.enableBtn(this.config.btnForward);
        } else {
            this.disableBtn(this.config.btnForward);
        }
        this.form.classList.add(this.config.displayNoneClass);
        this.config.thankElem.classList.remove(this.config.displayNoneClass);
    }

    array_unique(arr) {
        return arr.filter((item, i, ar) => ar.indexOf(item) === i);
    }

    setPrevNext(prevIndex, targetEl, direction) {
        let btnBack = this.config.btnBack,
            btnForward = this.config.btnForward,
            items = this.config.items,
            inputs = targetEl.querySelectorAll('.jsInput'),
            curIndex = this.getCurIndex(),
            history = [],
            nextId = targetEl.nextElementSibling.id;

        if (btnBack.dataset.target) {
            history = btnBack.dataset.target.split(',');
        }

        inputs.forEach(function (el) {
            if (el.checked) {
                nextId = el.dataset.next;
            }
        });
        if (inputs.length == 1) {
            nextId = inputs[0].dataset.next;
        }

        btnForward.dataset.target = nextId;
        if (direction == 'forward') {
            if (prevIndex != items.length - 1 && items[prevIndex].id) {
                history.push(items[prevIndex].id);
            }
            btnBack.dataset.target = this.array_unique(history).join(',');
        }
        if (direction == 'back') {
            history = history.slice(0, history.length - 1);
            btnBack.dataset.target = this.array_unique(history).join(',');
        }

        if (this.validate(curIndex)) {
            this.enableBtn(btnForward);
        } else {
            this.disableBtn(btnForward);
        }
        this.progress();
        this.hideError(this.config.errorElement);
    }

    changeListener(e, currentElement) {
        let curIndex = this.getCurIndex();
        if (e.target.dataset.next) {
            this.config.btnForward.dataset.target = e.target.dataset.next;
        }
        if (this.validate(curIndex)) {
            this.enableBtn(this.config.btnForward);
            this.hideError(this.config.errorElement);
            if (currentElement.classList.contains(this.config.autoChangeClass)) {
                this.changeQ('forward');
            }
        } else {
            this.disableBtn(this.config.btnForward);
            this.showError(this.config.errorElement);
        }
    }
}
