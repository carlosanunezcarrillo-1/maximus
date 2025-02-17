#include <stdio.h>

int main(){
	double num1, num2, result;
	char op;

	printf("Enter first number: ");
	scanf("%lf", &num1);

	printf("Enter an operator (+, -, *, /): /): ");
	scanf(" %c", &op);

	printf("Enter second number: ");
	scanf("%lf", &num2);

	switch(op){
		case '+': result = num1 + num2; break;
		case '-': result = num1 - num2; break;
		case '*': result = num1 * num2; break;
		case '/': 
			if (num2 != 0) result = num1/num2;
			else {
				printf("Error: Division by zero!\n");
				return 1;
			}	
			break;
		default:
			printf("Invalid operator\n");
			return 1;

	}
	printf("Result: %lf\n", result);
	return 0;
	}
