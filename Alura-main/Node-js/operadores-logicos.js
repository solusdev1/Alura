let notafinal = 7;
let faltas = 2;

if(notafinal<7 && faltas> 4){ // se a nota final for menor que 7 &&(e) as faltas for maior que 4
    console.log("Reprovado");
}
else if(notafinal<7 || faltas >=4){ // se a nota final for menor que 7 ||(ou) as faltas for maior ou igual a 4  
    console.log("Recuperação");
}

else{
    console.log("Aprovado");
}
