# Random musing on Jetpack Compose

Compose is a new reactive-style ui framework for android. After poking around
in the source code, there are some interesting architectural decisions I would
like to highlight:

1. It is actually quite ambitious, instead of binding to TextView etc, it is
   laying out and rendering the ui itself. There will be interoperability with
   existing views but it represents a whole to way to render ui on android.
2. It’s completely written in kotlin using the kotlin compiler plugin api. I
   don’t believe there will be a way to define your ui using java with this.
   Yet another reason to advocate for kotlin for android apps!
3. The android parts are completely abstracted out. This means testing ui is
   going to potentially be very easy. It also means that there's no reason this
   couldn’t be made to work on iOS with kotlin native. I doubt it’s on anyone’s
   roadmap but it's certainly an interesting idea.
4. The syntax is more 'magical' than other reactive frameworks. Instead of
   returning your ui, you construct it by calling functions that are annotated
   with `@Composable`. State is updated by either annotating values with
   `@Model`. Or by wrapping them in a `state {}` function to create a delegate.
   Opinions may very on if they went too far, but I’m personally a fan.

```kotlin
@Composable
fun CustomRadioGroup() {
    val radioOptions = listOf("Disagree", "Neutral", "Agree")
    var selectedOption by +state { radioOptions[0] }
    val textStyle = +themeTextStyle { subtitle1 }

    RadioGroup {
        Row(mainAxisSize = MainAxisSize.Min) {
            radioOptions.forEach { text ->
                val selected = text == selectedOption
                RadioGroupItem(
                    selected = selected,
                    onSelected = { selectedOption = text }) {
                    Padding(padding = 10.dp) {
                        Column {
                            RadioButton(selected = selected)
                            Text(text = text, style = textStyle)
                        }
                    }
                }
            }
        }
    }
}
```
