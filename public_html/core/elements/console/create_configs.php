<?php
$modx->addPackage('migx', MODX_CORE_PATH . 'components/migx/model/');
$path_to_configs = MODX_CORE_PATH . 'elements/configs/';
$file_names = scandir($path_to_configs);
unset($file_names[0], $file_names[1]);
foreach($file_names as $file_name){
    $config_data = json_decode(file_get_contents($path_to_configs . $file_name),1);
    $config_data['name'] = str_replace('.json', '', $file_name);
    $obj = $this->modx->newObject('migxConfig');
    foreach($config_data as $field => $value){
        if(is_array($value)){
            $obj->set($field, json_encode($value));
        }else{
            $obj->set($field, $value);
        }

    }
    $obj->save();
}