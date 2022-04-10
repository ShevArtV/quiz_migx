export default class Quiz {
    constructor(rootEl, config = {}) {
        let $this = this;
        $this.config = {
            form: rootEl,
            itemsSelector: '.jsQuizItem',
            progressBarSelector: '.jsQuizProgress',
            btnBackSelector: '.jsQuizBtnBack',
            btnForwardSelector: '.jsQuizBtnForward',
            btnSubmitSelector: '.jsQuizBtnSubmit',
            inputSelector: '.jsInput',
            modalThankSelector: '#modalThanks',
            errorSelector: '.jsError',
            trackSelector: '.jsTrack',
            errorText: 'Заполните поле!',
            disabledClass: 'disabled',
            hiddenClass: 'visually-hidden',
            displayNoneClass: 'd-none',
            autoChangeClass: 'jsAutoChange',
            formClass: 'jsQuizForm',
            progressBarBgTransparentClass: 'bg-transparent',
            progressBarWidthClass: 'w-100',
            progressBarTextColorClass: 'text-primary',
        };
        Object.assign($this.config, config, {
            items: $this.config.form.querySelectorAll($this.config.itemsSelector),
            progressBar: $this.config.form.querySelector($this.config.progressBarSelector),
            btnBack: $this.config.form.querySelector($this.config.btnBackSelector),
            btnForward: $this.config.form.querySelector($this.config.btnForwardSelector),
            btnSubmit: $this.config.form.querySelector($this.config.btnSubmitSelector),
            inputs: $this.config.form.querySelectorAll($this.config.inputSelector),
            modalThank: document.querySelector($this.config.modalThankSelector),
            errorElement: $this.config.form.querySelector($this.config.errorSelector),
            trackElements: $this.config.form.querySelectorAll($this.config.trackSelector),
        });

        $this.config.btnForward.dataset.target = $this.config.items[1].id;
        $this.config.btnBack.dataset.target = $this.config.items[0].id;

        function showError(element) {
            element.innerText = $this.config.errorText;
            element.style.opacity = 1;
        };

        function hideError(element) {
            element.innerText = '';
            element.style.opacity = 0;
        };

        function enableBtn(element) {
            element.classList.remove($this.config.disabledClass);
        };

        function disableBtn(element) {
            element.classList.add($this.config.disabledClass);
        };

        function getCurIndex() {
            let items = $this.config.items;
            for (let i = 0; i < items.length; i++) {
                if (!items[i].classList.contains($this.config.hiddenClass)) {
                    return i;
                }
            }
        };

        function validate(index) {
            let items = $this.config.items,
                inputs = items[index].querySelectorAll($this.config.inputSelector),
                bool = false;
            for (let i = 0; i < inputs.length; i++) {
                if(inputs[i].dataset.required){
                    if (inputs[i].getAttribute('type') == 'radio' || inputs[i].getAttribute('type') == 'checkbox') {
                        if (inputs[i].checked) {
                            bool = true;
                        }
                    } else {
                        if (inputs[i].value) {
                            bool = true;
                        }
                    }
                }
                else{
                    bool = true;
                }
            }
            return bool;
        };

        function progress() {
            let progressBar = $this.config.progressBar,
                width = 0,
                track = [],
                targets = $this.config.btnBack.dataset.target,
                history = targets ? targets.split(',') : [];
            $this.config.trackElements.forEach(function(el){
                track.push(el.dataset.next);
            });
            track = track.filter((value, index, self) => {
                return self.indexOf(value) === index
            });
            width = Math.round( history.length / track.length * 100);
            if (width) {
                progressBar.classList.remove($this.config.progressBarBgTransparentClass, $this.config.progressBarTextColorClass, $this.config.progressBarWidthClass);
                progressBar.style.width = width + '%';
                progressBar.innerText = width + '%';
            } else {
                progressBar.classList.add($this.config.progressBarBgTransparentClass, $this.config.progressBarTextColorClass, $this.config.progressBarWidthClass);
                progressBar.style.width = width;
                progressBar.innerText = '0%';
            }
        };

        function changeQ(direction) {
            let items = $this.config.items,
                btnForward = $this.config.btnForward,
                btnSubmit = $this.config.btnSubmit,
                btnBack = $this.config.btnBack,
                curIndex = getCurIndex(),
                target =  direction == 'forward' ? btnForward.dataset.target.split(',') : btnBack.dataset.target.split(','),
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

            items[curIndex].classList.add($this.config.hiddenClass);

            if (targetEl) {
                targetEl.classList.remove($this.config.hiddenClass);
                items[curIndex].classList.add($this.config.hiddenClass);
            }
            if(targetEl.id == items[items.length - 1].id){
                btnForward.classList.add($this.config.displayNoneClass);
                btnSubmit.classList.remove($this.config.displayNoneClass);
            }
            else{
                btnForward.classList.remove($this.config.displayNoneClass);
                btnSubmit.classList.add($this.config.displayNoneClass);
            }
            if(targetEl.id != items[0].id){
                btnBack.classList.remove($this.config.hiddenClass);
                btnBack.classList.remove($this.config.disabledClass);
            }
            else{
                btnBack.classList.add($this.config.hiddenClass);
                btnBack.classList.add($this.config.disabledClass);
            }
            setPrevNext(curIndex,targetEl, direction);
            $this.config.form.dispatchEvent(quizEvent);
        };

        function successSubmit() {
            let items = $this.config.items;
            $this.config.form.reset();
            $this.config.btnBack.classList.add($this.config.hiddenClass, $this.config.disabledClass);
            $this.config.btnBack.removeAttribute('data-target');
            $this.config.btnSubmit.classList.add($this.config.displayNoneClass);
            $this.config.btnForward.classList.remove($this.config.displayNoneClass);
            progress();
            for (let i = 0; i < items.length; i++) {
                if (i > 0) {
                    items[i].classList.add($this.config.hiddenClass);
                } else {
                    items[i].classList.remove($this.config.hiddenClass);
                }
            }
            if(validate(0)){
                enableBtn($this.config.btnForward);
            }else{
                disableBtn($this.config.btnForward);    
            }
        };

        function array_unique(arr){
            return arr.filter((item, i, ar) => ar.indexOf(item) === i);
        };

        function setPrevNext(prevIndex,targetEl,direction){
            let btnBack = $this.config.btnBack,
                btnForward = $this.config.btnForward,
                items = $this.config.items,
                inputs = targetEl.querySelectorAll('.jsInput'),
                curIndex = getCurIndex(),
                history = [],
                nextId = targetEl.nextElementSibling.id;

            if(btnBack.dataset.target){
                history = btnBack.dataset.target.split(',');
            }

            inputs.forEach(function(el){
                if(el.checked){
                    nextId = el.dataset.next;
                }
            });
            if(inputs.length == 1){
                nextId = inputs[0].dataset.next;
            }

            btnForward.dataset.target = nextId;
            if (direction == 'forward') {
                if(prevIndex != items.length - 1 && items[prevIndex].id){
                    history.push(items[prevIndex].id);
                }
                btnBack.dataset.target = array_unique(history).join(',');
            }
            if (direction == 'back') {
                history = history.slice(0,history.length-1);
                btnBack.dataset.target = array_unique(history).join(',');
            }

            if (validate(curIndex)) {
                enableBtn(btnForward);
            } else {
                disableBtn(btnForward);
            }
            progress();
            hideError($this.config.errorElement);
        }

        let inputs = $this.config.inputs;
        $this.config.errorElement.style.opacity = 0;
        if(validate(0)){
            enableBtn($this.config.btnForward);
        }else{
            disableBtn($this.config.btnForward);    
        }
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('change', function (e) {
                let curIndex = getCurIndex();
                if(e.target.dataset.next){
                    $this.config.btnForward.dataset.target = e.target.dataset.next;
                }
                if (validate(curIndex)) {
                    progress();
                    enableBtn($this.config.btnForward);
                    hideError($this.config.errorElement);
                    if (inputs[i].classList.contains($this.config.autoChangeClass)) {
                        changeQ('forward');
                    }
                } else {
                    disableBtn($this.config.btnForward);
                    showError($this.config.errorElement);
                }
            });
        }

        $this.config.btnForward.addEventListener('click', function (e) {
            changeQ('forward');
        });

        $this.config.btnBack.addEventListener('click', function (e) {
            changeQ('back');
        });

        if (window.jQuery) {
            $(document).on('af_complete', function (event, response) {
                if (response.success && $(response.form).hasClass($this.config.formClass)) {
                    successSubmit();
                }
            });
        }
    }
}