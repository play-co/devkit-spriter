#Spriter

####Index  

-  <a href="#about">About the metadata.json file</a>
-  <a href="#examples">Examples</a>
-  <a href="#api">API</a>

<a name="about"></a>
##About the metadata.json file 

The `metadata.json` file is a JSON file that is placed inside any directory that is to be sprited (or one that you'd like to filter in some way by the spriter) which applies rules and options recursively unless another `metadata.json` file overwrites its options down the directory structure.

Here is one example of how a `metadata.json` may look :

~~~
{
	"rules": [
		{
			"cond-target": "browser-mobile",
			package: false
		},
		{
			"cond-target": "native-android",
			"cond-fileList": ["bar/baz.png", "foo.png"],
			"forceJpeg": true
		}

	]

}
~~~  
*This metadata.json states that on browser-mobile builds to
not package any files in this directory (or below), and for 
native-android, force the given files to be jpegs*


The `metadata.json` file is essentially a compilation of **rules** which define how the current directory (and below) should be sprited (or not sprited) or treated.

There should be a top-level `rules` key which should consist of an `array` of `rule objects` where each `rule object` contains at least one `condition` to describe when that rule should be triggered, as well as options describing what to be done when triggered.

`rules` are allowed to overlap and there can be multiple rules with overlapping `conditions` within the same `metadata.json` file.

A `rule` without any conditions will always occur.

###Let's walk through the creation of a `metadata.json` file.

1) Let's first assume some directory structure for your resources.  

~~~
- foo.png
- bar.png
- baz.png
backgrounds/
	- bg1.png
	- bg2.png
	- bg3.png
character/
	walk/
		- walk1.png
		- walk2.png
		- walk3.png
	run/
		- run1.png
		- run2.png
		- run3.png

~~~

2) Let's say that we wanted to make sure that all of the images inside of the `backgrounds` directory were exported as jpegs when building for browser-mobile. We would first create a rules array inside of a `metadata.json` file inside of the `backgrounds` directory so that the directory structure would then look like:

~~~
foo.png
bar.png
baz.png
backgrounds
	- metadata.json
	- bg1.png
	- bg2.png
	- bg3.png
...
~~~

With the `metadata.json` file starting out as:

~~~
{
	"rules": [
	]
}
~~~  

3) Now let's add a rule that will be triggered when we are building for browser-mobile

~~~
{
	"rules": [
		{	
		 	"cond-target": "browser-mobile",
		}
	]
}
~~~  

4) And now, force files to be jpegs under this condition

~~~
{
	"rules": [
		{	
		 	"cond-target": "browser-mobile",
		 	"forceJpeg": true
		}
	]
}
~~~  

4a) Another way to accomplish the same result would be to place a `metadata.json` in the base directory and add a condition for files along with the current one for targets. So that the rule would only trigger for browser-mobile and on those specific files. Here is what that would look like: 

~~~
{
	"rules": [
		{	
		 	"cond-target": "browser-mobile",
		 	"cond-fileList": ["backgrounds/bg1.png", 
							  "backgrounds/bg2.png", 
							  "backgrounds/bg3.png"],
		 	"forceJpeg": true
		}
	]
}
~~~  

4b) or even simpler:

~~~
{
	"rules": [
		{	
		 	"cond-target": "browser-mobile",
		 	"cond-fileList": ["backgrounds"]
		 	"forceJpeg": true
		}
	]
}
~~~  

<a name="examples"></a>
#Examples
###Here are several examples with explanations

`metadata.json`  

~~~  
{
	"rules": [
		{
 			"cond-target": "browser-mobile",
			"pngquant": {
				"speed": 3,
				"quality": "0-100"
			},
			"po2": false
		},
		{
 			"cond-target": "native-android",
			"pngquant": {
				"speed": 8,
				"quality": "0-100"
			},
			"po2": true
		}
	]
}
~~~  
*stuff*  

---
Given this directory structure:

~~~  
icons/
	metadata.json
	- go.png
	- sms.png
	alternative/
		metadata.json
		- go.png
		- sms.png
~~~

***icons/metadata.json***  

~~~  
{
	"rules": [
		{
			"cond-target": "browser-mobile",
			"package": false,
			"sprite": false			
		}
	]
}
~~~
*stuff*  

***icons/alternative/metadata.json***  

~~~  
{
	"rules": [
		{
			"cond-target": "browser-mobile",
			"package": true,
			"sprite": true			
		}
	]
}
~~~
*stuff*  

However, this can all be done more simply by doing this in ***icons/metadata.json***

~~~  
{
	"rules": [
		{
			"cond-target": "browser-mobile",
			"cond-fileList": ["./go.png", "./sms.png"],
			"package": true,
			"sprite": true			
		}
	]
}
~~~

<a name="api"></a>
#API

###Conditions 
- `cond-buildMode` *string*    
Accepts:  
	- "debug"
	- "release"

- `cond-target` *string*    
Accepts:  
	- "native-android"  					
	- "native-ios"  
	- "browser-mobile"  	
- `cond-fileList` *string array*    
	- A list of files to process.  
	- Filepaths are relative to the cwd of the `metadata.json`
	- It's perfectly legal to give files in child directories
	- Directories also count as files  
	
###Options  
Options are applied onto items which pass the condition tests of a rule.  
These items will be referenced as "items" below.  

- `package` *boolean*  
**default: true**  
Whether or not to package the items in the build.  

- `sprite` *boolean*  
**default: true**  
Whether or not to sprite the items on sprite sheets or leave them separate.

- `scale` *number*  
**default: 1.0**  
How much to scale the items by.

- `forceJpeg` *boolean*  
**default: false**  
Whether or not to force converting the items to jpeg

- `po2` *boolean*  
**default: true**  
Whether or not the sprite sheets created from the items should be power's of two

#####PNG Quant Options

- `usePNGQuant` *boolean*  
**default: false**  
Whether or not to use PNGQuant

- `PNGQuantSpeed` *number*  
**default: 3**  

- `PNGQuantQuality` *string*  
**default: 0-100**  
