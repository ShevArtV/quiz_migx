<?php
$resource = $modx->getObject('modResource', $rid);
$quizID = $quizID ?: 1;
if($resource){
    $allQuiz = json_decode($resource->getTVValue('quiz'),1);
    foreach($allQuiz as $quiz){
        if($quiz['MIGX_id'] == $quizID){
            $quizData = $quiz;
        }
    }

    if($quizData){
        $pdoTools = $modx->getService('pdoTools');

        $emailChunkPath = $quizData['email_chunk'] ?: '@FILE chunks/emails/tplEmailQuiz.html'; // чанк письма
        $thanksChunkPath = $quizData['thanks_chunk'] ?: '@FILE chunks/quiz/thanks.html'; // чанк блока Спасибо
        $itemChunkPath = $quizData['item_chunk'] ?: '@FILE chunks/quiz/item.html'; // чанк вопроса
        $lastItemChunkPath = $quizData['last_item_chunk'] ?: '@FILE chunks/quiz/lastItem.html'; // чанк финальной формы
        $addBlocksChunkPath = $quizData['add_blocks_chunk'] ?: '@FILE chunks/quiz/add_blocks.html'; // чанк дополнительной информации
        $params['form'] = $quizData['form_chunk'] ?: '@FILE chunks/forms/quizForm.html'; // чанк обертки
        $params['emailFrom'] = $quizData['email_from'] ?: $modx->getOption('emailsender')?:'noreply@'. $modx->getOption('http_host'); // почта скоторой будут приходить письма
        $params['snippet'] = 'FormIt';
        $params['hooks'] = 'FormItSaveForm,email';

        $params['formName'] = $quizData['name'];
        $params['successMessage'] = $quizData['success_message'] ?: 'Опрос отправлен успешно!';
        $params['validationErrorMessage'] = $quizData['error_message'] ?: 'В форме содержатся ошибки!';
        $params['emailSubject'] = $quizData['email_subject'] ?: 'Опрос';
        $params['emailTo'] = $quizData['email_to'] ?: $modx->getOption('email');
        $fieldValidation = array();
        $quizItems = json_decode($quizData['items'],1);
        $quizFields = json_decode($quizData['fields'],1);
        $itemsCount = count($quizItems);

        if($quizData['add_for_item']){
            $addBlocks = json_decode($quizData['add_for_item'],1);
            $params['add_blocks'] =  $pdoTools->parseChunk($addBlocksChunkPath, array('add_blocks' => $addBlocks));
        }

        if($quizData['avatar']){
            $params['avatar'] = $quizData['avatar'];
        }
        if($quizData['avatar_text']){
            $params['avatar_text'] = $quizData['avatar_text'];
        }

        $params['thanks'] =  $pdoTools->parseChunk($thanksChunkPath, array('content' => $quizData['content']));
        $params['fields'] = $pdoTools->parseChunk($lastItemChunkPath, array(
            'quizFields' => $quizFields,
            'title_last' => $quizData['title_last'],
            'subtitle_last' => $quizData['subtitle_last'],
            'itemsCount' => $itemsCount));
        $params['items'] = $pdoTools->parseChunk($itemChunkPath, array('quizItems' => $quizItems, 'itemsCount' => $itemsCount));
        $email = $pdoTools->parseChunk($emailChunkPath, array('quizFields' => $quizFields,'quizItems' => $quizItems, 'itemsCount' => $itemsCount));
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
}
