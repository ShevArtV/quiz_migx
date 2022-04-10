<?php
$resource = $modx->getObject('modResource', $rid);
$quizID = ($quizID - 1) ?: 0;
if($resource){
    $emailPath = 'chunks/emails/tplEmailQuiz.html'; // чанк письма
    $params['form'] = '@FILE chunks/forms/quizForm.html'; // чанк обертки
    $params['emailFrom'] = $modx->getOption('emailsender')?:'noreply@'. $modx->getOption('http_host'); // почта скоторой будут приходить письма
    $params['snippet'] = 'FormIt';
    $params['hooks'] = 'FormItSaveForm,email';

    $quizData = json_decode($resource->getTVValue('quiz'),1);
    $params['formName'] = $quizData[$quizID]['name'];
    $params['successMessage'] = $quizData[$quizID]['success_message'] ?: 'Опрос отправлен успешно!';
    $params['validationErrorMessage'] = $quizData[$quizID]['error_message'] ?: 'В форме содержатся ошибки!';
    $params['emailSubject'] = $quizData[$quizID]['email_subject'] ?: 'Опрос';
    $params['emailTo'] = $quizData[$quizID]['email_to'] ?: $modx->getOption('email');

    $fieldValidation = array();
    $quizItems = json_decode($quizData[$quizID]['items'],1);
    $quizFields = json_decode($quizData[$quizID]['fields'],1);
    $pdoTools = $modx->getService('pdoTools');
    $params['fields'] = $pdoTools->parseChunk('@FILE chunks/quiz/lastItem.html', array('quizFields' => $quizFields, 'itemsCount' => count($quizItems))); // чанк финальной формы
    $params['items'] = $pdoTools->parseChunk('@FILE chunks/quiz/item.html', array('quizItems' => $quizItems, 'itemsCount' => count($quizItems))); // чанк вопроса
    $email = $pdoTools->parseChunk('@FILE '.$emailPath, array('quizFields' => $quizFields,'quizItems' => $quizItems, 'itemsCount' => count($quizItems)));
    $params['emailTpl'] = '@INLINE '.str_replace('##', '{', $email);

    foreach($quizFields as $k => $field){
        $fieldName = 'field'.$k; // формируем имя поля
        $validators = json_decode($field['validation'],1); // получаем список валидаторов
        $validatorsStr = ''; // сюда запишем итоговую строку валидации поля
        $addErrorParams = ''; // дополнительные параметры для кастомных сообщениях об ошибках
        foreach($validators as $validator){
            if($validator['vText']){
                $params[$fieldName.'.'.'vText'.ucfirst($validator['type'])] = $validator['vText']; // добавляем параметры с текстами ошибок
            }

            switch ($validator['type']){
                case 'minLength':
                    $validatorsStr .= ':minLength=^'.$validator['value'].'^';
                    break;
                case 'maxLength':
                    $validatorsStr .= ':maxLength=^'.$validator['value'].'^';
                    break;
                case 'rexp':
                    $validatorsStr .= ':rexp=^'.$validator['value'].'^';
                    break;
                case 'contains':
                    $validatorsStr .= ':contains=^'.$validator['value'].'^';
                    break;
                case 'blank':
                    $validatorsStr .= ':blank';
                    break;
                case 'required':
                    $validatorsStr .= ':required';
                    break;
            }
        }
        $fieldValidation[] = $fieldName.$validatorsStr;
    }
    if(count($fieldValidation)){
        $params['validate'] = implode(',', $fieldValidation); // добавляем параметры валидации
    }

    return $modx->runSnippet('AjaxForm', $params);
}
