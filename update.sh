#!/bin/bash

# START=187901
# END=188000
# DELAY=3

# while [ $END -le  100000000 ]
# do  
#     echo "현재 : $START $END"        
#     curl -H "Content-Type: application/json" -X POST "http://127.0.0.1:8080/vams/actor?start=$START&end=$END" > downloads/$START'_'$END.json
#     START=`expr $START + 100`    
#     END=`expr $END + 100`    
#     echo ""
#     sleep $DELAY  
# done

START=34546001
SCOPE=1000
DELAY=3

while [ `expr $START + $SCOPE` -le 100000000 ]
do    
    echo "현재 : $START `expr $START + $SCOPE`"
    curl -H "Content-Type:application/json" -X POST "http://127.0.0.1:8080/vams/actor?start=$START&scope=$SCOPE" > downloads/$START'_'`expr $START + $SCOPE`.json
    START=`expr $START + $SCOPE`
    echo ""
    sleep $DELAY
done