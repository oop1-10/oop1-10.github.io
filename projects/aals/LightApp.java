import org.firmata4j.I2CDevice;
import org.firmata4j.IODevice;
import org.firmata4j.Pin;
import org.firmata4j.firmata.FirmataDevice;
import org.firmata4j.ssd1306.SSD1306;

import org.knowm.xchart.QuickChart;
import org.knowm.xchart.XYChart;
import org.knowm.xchart.SwingWrapper;


import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Timer;

public class LightApp {


    public final String myPort = "/dev/cu.usbserial-0001"; // modify for your own computer & setup.
    public static IODevice myGroveBoard;
    public static SSD1306 myOled;

    /**
     * Constructor for a ButtonApp
     */
    public LightApp() {

        myGroveBoard = new FirmataDevice(this.myPort);

        try {
            myGroveBoard.start(); // start communication with board;
            myGroveBoard.ensureInitializationIsDone();
            System.out.println("Board started.");

            // Initialize the OLED (SSD1306) object
            I2CDevice i2cObject = myGroveBoard.getI2CDevice((byte) 0x3C); // Use 0x3C for the Grove OLED
            myOled = new SSD1306(i2cObject, SSD1306.Size.SSD1306_128_64); // 128x64 OLED SSD1515
            myOled.init();

        } catch (Exception ex) { // if not, detail the error.
            System.out.println("couldn't connect to board.");
            return; //no point continuing at this point.
        }

        /*
         * Defining the pins associated with the groveboard
         */

        HashMap<String, Pin> pins = new HashMap<>(); // hash map containing my pin objects

        pins.put("button", myGroveBoard.getPin(6)); // creating pin object for my button
        pins.put("led", myGroveBoard.getPin(4)); // creating pin object for my led
        pins.put("light", myGroveBoard.getPin(20)); // creating pin object for my light sensor
        pins.put("buzzer", myGroveBoard.getPin(5)); // creating pin object for my buzzer
        pins.put("potentiometer", myGroveBoard.getPin(14)); // creating pin object for my potentiometer

        try {
            /*
             * Set pins to their individual modes
             * MOISTURE pin must be set to ANALOG, since we want a value intermediate of 1 and 0
             */
            pins.get("button").setMode(Pin.Mode.INPUT); // set mode for button to input
            pins.get("led").setMode(Pin.Mode.OUTPUT); // setting mode for led to output
            pins.get("light").setMode(Pin.Mode.ANALOG); // setting mode for light sensor to analog
            pins.get("buzzer").setMode(Pin.Mode.OUTPUT); // setting mode for buzzer to output
            pins.get("potentiometer").setMode(Pin.Mode.ANALOG); // setting mode for potentiometer to analog


            ArrayList<Double> timePast = new ArrayList<>(); // creating time past and light data arrays
            ArrayList<Double> lightData = new ArrayList<>();
            timePast.add(0.0); // initializing first values
            lightData.add(lightVoltage(pins.get("light").getValue()));


            /*
             * External library associated with the chart, provides a real-time updating graph, creation of object below
             */

            final XYChart chart = QuickChart.getChart("Light Vs Time Graph", "Time (s)", "Light (V)", "light", timePast, lightData);

            final SwingWrapper<XYChart> sw = new SwingWrapper<>(chart);
            sw.displayChart(); // show the chart

            Timer timer = new Timer(true); // create the timer object
            LightTask task = new LightTask(pins, timer, myOled, myGroveBoard, chart, sw, timePast, lightData); // call the timer task
            timer.schedule(task, 2500, 500); // schedule the method to run every 500 ms

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Stop the Board
     * @param myGroveBoard board object
     * @throws IOException if board is not connected
     */
    public static void stopApp(IODevice myGroveBoard, SSD1306 myOled, HashMap<String, Pin> pins) throws IOException {
        pins.get("led").setValue(0); // turn off led
        pins.get("buzzer").setValue(0); // turn off buzzer
        myOled.clear(); // clear oled screen
        myGroveBoard.stop(); // shut down grove board
    }

    /**
     * @param currentValue vurrent 10 bit value from light sensor
     * @return the raw voltage provided by the light sensor
     */
    public static double lightVoltage(double currentValue) {
        return currentValue * ((double) 5/1023);
    }


    public static void main(String[] args) throws IOException {
        LightApp app = new LightApp(); // run the light app
    }
}
