# css2c
## A joke.
### From this:
```css
@import '<stdio.h>';

.main:int {
	foo: var("Hello, World!");
	printf: "%s\n" foo;
	return: 0;
}
```
### To this:
```c
#include <stdio.h>
int main() {
	char foo[] = "Hello, World!";
	printf("%s\n", foo);
	return 0;
}
```
