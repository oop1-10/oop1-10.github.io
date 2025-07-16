import org.firmata4j.IODevice;
import org.firmata4j.Pin;
import org.firmata4j.ssd1306.SSD1306;
import org.knowm.xchart.SwingWrapper;
import org.knowm.xchart.XYChart;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Timer;
import java.util.TimerTask;

public class PumpTask extends TimerTask {
    Pin ledPin;
    Pin buttonPin;
    Pin moisturePin;
    Pin pumpPin;
    Timer timer;
    IODevice board;
    SSD1306 oled;
    ArrayList<Double> moistureData;
    ArrayList<Double> timePast;
    XYChart chart;
    SwingWrapper<XYChart> sw;


    /**
     * @param ledPin The pin associated with the LED on the board
     * @param buttonPin The pin associated with the button on the board
     * @param moisturePin The pin associated with the moisture sensor connected via grove cable
     * @param pumpPin The pin associated with the pump control via MOSFET
     * @param timer The timer object (for stopping the task if button is pressed)
     * @param board The board object (for stopping the task if button is pressed)
     * @param oled The oled object (for stopping the task if button is pressed)
     * @param timePast The timePast ArrayList object that contains the x values for the graph
     * @param moistureData The moistureData ArrayList object that contains the y values for the graph
     * @param chart The chart object (for updating upon method call)
     * @param sw The SwingWrapper object (for updating upon mathod call)
     */
    PumpTask(Pin ledPin, Pin buttonPin, Pin moisturePin, Pin pumpPin, Timer timer, IODevice board, SSD1306 oled, ArrayList<Double> timePast, ArrayList<Double> moistureData, XYChart chart, SwingWrapper<XYChart> sw) {
        this.ledPin = ledPin;
        this.buttonPin = buttonPin;
        this.moisturePin = moisturePin;
        this.pumpPin = pumpPin;
        this.timer = timer;
        this.board = board;
        this.oled = oled;
        this.timePast = timePast;
        this.moistureData = moistureData;
        this.chart = chart;
        this.sw = sw;
    }

    /**
     * Method for pumping water when the soil is dry
     * The amount of time the pump is on for depends on the dryness lavel obtained by the soil moisture sensor
     *
     * @param time the amount of time to pump water
     */
    public void pump(int time) {
        try {
            pumpPin.setValue(1); // turn on pump
            ledPin.setValue(1); // flash on red LED when pumping
            Thread.sleep(time); // sleep the thread for the allotted time
            pumpPin.setValue(0); // turn off pump
            ledPin.setValue(0); // flash on red LED when pumping
            System.out.println("Done.");
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * The timer task run method, the brains of the whole thing
     *
     * First, it determines if the button is pressed or not, if it is, the timer cancels, the oled clears, the board stops.  The chart does not close, for analysis purposes
     */
    @Override
    public void run() {
        int buttonValue = (int) buttonPin.getValue();
        if (buttonValue != 0) {
            timer.cancel(); // cancel timer if button is pressed
            oled.clear(); // clear oled if button is pressed
            try {
                board.stop(); // stop board if button is pressed
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        } else {
            double moistureValue = (double) moisturePin.getValue(); // obtain current moisture value

            timePast.add(timePast.get(timePast.size() - 1) + 1); // save the time elapsed since first recorded data piece (for graph)
            moistureData.add(moistureValue); // save the current moisture value to y on graph

            if (timePast.size() >= 10) { // we want to display only the first 10 values on the graph
                timePast.removeFirst(); // therefore, remove the unneeded data
                moistureData.removeFirst(); // ||
            }

            chart.updateXYSeries("Moisture", timePast, moistureData, null); // update the chart object
            sw.repaintChart(); // repaint the chart with newly acquired data

            System.out.println(moistureValue); // print the moisture value to console
            String moistureString = "Moisture: " + moistureValue; // create a string to display on the oled

            oled.getCanvas().drawString(0,0,moistureString); // update oled string
            oled.display(); // display new string to oled

            if (moistureValue >= 620) { // plant needs water, its dry
                System.out.println("Plant is dry, needs water.");
                pump(1000); // pump for 1 second when dry
            } else if (moistureValue >= 580) { //plant needs a bit of water, but not too much
                System.out.println("Plant needs some water.");
                pump(500); // pump for half a second when slightly dry
            } else { // plant has water
                //do nothing
            }
        }
    }
}
